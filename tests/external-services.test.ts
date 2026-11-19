import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { useFakes, resetFakes, fake, file } from './helpers/fakes.ts';

// The modules that call outside services: Supabase Storage, Resend emails and the AI model.
// The real modules run, with `fetch` faked, so these check what would be sent and how failures are handled.
useFakes({ keep: ['server/storage.ts', 'server/email.ts', 'server/ai.ts'] });
const storage = await import('../src/lib/server/storage.ts');
const email = await import('../src/lib/server/email.ts');
const ai = await import('../src/lib/server/ai.ts');
const { LlmError } = await import('../src/lib/server/llm.ts');

type Sent = { url: string; method: string; headers: Headers; body: unknown };
let sent: Sent[] = [];
let reply: (url: string) => Response = () => new Response('ok');
const realFetch = globalThis.fetch;
const quiet = async <T>(fn: () => Promise<T>) => {
	const errorLog = console.error;
	console.error = () => {};
	try {
		return await fn();
	} finally {
		console.error = errorLog;
	}
};

beforeEach(() => {
	resetFakes();
	sent = [];
	reply = () => new Response('ok');
	globalThis.fetch = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
		const url = String(input);
		sent.push({ url, method: init.method ?? 'GET', headers: new Headers(init.headers), body: init.body });
		return reply(url);
	}) as typeof fetch;
	Object.assign(fake.env, {
		SUPABASE_URL: 'https://project.supabase.test',
		SUPABASE_SECRET_KEY: 'secret-key',
		RESEND_API_KEY: 'resend-key',
		EMAIL_FROM: 'CareerConnect <no-reply@careerconnect.test>'
	});
});
afterEach(() => {
	globalThis.fetch = realFetch;
});

// --- storage (US-04 photos, US-10 resumes) ---

test('storage: uploads overwrite the same path, with the secret key only in the headers', async () => {
	const url = await storage.uploadAvatar('user-1', file('me.png', 'image/png'));
	assert.match(url, /^https:\/\/project\.supabase\.test\/storage\/v1\/object\/public\/avatars\/user-1\/avatar\?v=\d+$/);
	await storage.uploadResume('user-1/abc.pdf', file('cv.pdf', 'application/octet-stream'));

	const [avatar, resume] = sent;
	assert.equal(avatar.url, 'https://project.supabase.test/storage/v1/object/avatars/user-1/avatar');
	assert.equal(avatar.headers.get('authorization'), 'Bearer secret-key');
	assert.equal(avatar.headers.get('x-upsert'), 'true');
	assert.equal(resume.url, 'https://project.supabase.test/storage/v1/object/resumes/user-1/abc.pdf');
	// resumes are always stored as PDFs, whatever type the browser reported
	assert.equal(resume.headers.get('content-type'), 'application/pdf');
});

test('storage: a missing file is fine to delete and downloads as null; other errors throw', async () => {
	reply = () => new Response('not found', { status: 404 });
	await storage.deleteResume('user-1/gone.pdf');
	await storage.deleteAvatar('user-1');
	assert.equal(await storage.downloadResume('user-1/gone.pdf'), null);
	assert.deepEqual(sent.map((s) => s.method), ['DELETE', 'DELETE', 'GET']);

	reply = () => new Response('boom', { status: 500 });
	await assert.rejects(storage.deleteResume('user-1/abc.pdf'), /Delete from resumes failed \(500\)/);
	await assert.rejects(storage.downloadResume('user-1/abc.pdf'), /Download from resumes failed \(500\)/);
	await assert.rejects(storage.uploadAvatar('user-1', file('me.png', 'image/png')), /Upload to avatars failed \(500\)/);

	reply = () => new Response('%PDF-1.7');
	assert.equal(await (await storage.downloadResume('user-1/abc.pdf'))!.text(), '%PDF-1.7');
});

test('storage: refuses to run without the Supabase settings', async () => {
	delete fake.env.SUPABASE_SECRET_KEY;
	await assert.rejects(storage.deleteResume('x.pdf'), /SUPABASE_URL and SUPABASE_SECRET_KEY must be set/);
	assert.equal(sent.length, 0);
});

// --- emails (US-08, US-17, US-27) ---

test('emails: each one goes to Resend with the right recipient, subject and link or code', async () => {
	await email.sendVerificationEmail({ to: 'ana@example.com', verificationUrl: 'https://cc.test/verify?token=abc' });
	await email.sendPasswordResetCode('ana@example.com', '123456');
	await email.sendJobOfferEmail('ana@example.com', 'https://cc.test/jobs/1');

	assert.ok(sent.every((s) => s.url === 'https://api.resend.com/emails' && s.headers.get('authorization') === 'Bearer resend-key'));
	const bodies = sent.map((s) => JSON.parse(String(s.body)));
	assert.deepEqual(
		bodies.map((b) => [b.to, b.subject]),
		[
			[['ana@example.com'], 'Verify your CareerConnect email'],
			[['ana@example.com'], 'CareerConnect Password Reset Code'],
			[['ana@example.com'], 'Congratulations! You received a job offer']
		]
	);
	assert.match(bodies[0].html, /https:\/\/cc\.test\/verify\?token=abc/);
	assert.match(bodies[1].text, /123456/);
	assert.match(bodies[2].html, /https:\/\/cc\.test\/jobs\/1/);
});

test("emails: missing settings or a refused send throw, so the caller knows it wasn't sent", async () => {
	reply = () => new Response('invalid from address', { status: 422 });
	await quiet(async () => {
		await assert.rejects(email.sendVerificationEmail({ to: 'a@b.c', verificationUrl: 'u' }), /Could not send verification email/);
		await assert.rejects(email.sendPasswordResetCode('a@b.c', '123456'), /Could not send password reset email/);
		await assert.rejects(email.sendJobOfferEmail('a@b.c', 'u'), /Could not send job offer email/);
	});

	delete fake.env.EMAIL_FROM;
	sent = [];
	await assert.rejects(email.sendVerificationEmail({ to: 'a@b.c', verificationUrl: 'u' }), /EMAIL_FROM is not set/);
	await assert.rejects(email.sendPasswordResetCode('a@b.c', '1'), /Email configuration is missing/);
	await assert.rejects(email.sendJobOfferEmail('a@b.c', 'u'), /Email configuration is missing/);
	delete fake.env.RESEND_API_KEY;
	await assert.rejects(email.sendVerificationEmail({ to: 'a@b.c', verificationUrl: 'u' }), /RESEND_API_KEY is not set/);
	assert.equal(sent.length, 0);
});

// --- AI settings and resume text (US-24) ---

test('ai: configured only with a base URL and a model; local means this machine', () => {
	assert.equal(ai.aiConfigured(), false);
	assert.throws(() => ai.askJson({ system: '', user: '', schemaName: 'x', schema: {} }), LlmError);
	Object.assign(fake.env, { AI_BASE_URL: 'http://localhost:11434/v1', AI_MODEL: 'qwen' });
	assert.equal(ai.aiConfigured(), true);
	assert.equal(ai.aiIsLocal(), true);
	assert.equal(ai.aiModel(), 'qwen');
	fake.env.AI_BASE_URL = 'https://api.groq.com/openai/v1';
	assert.equal(ai.aiIsLocal(), false);
});

test('ai: askJson sends the request to the configured model', async () => {
	Object.assign(fake.env, { AI_BASE_URL: 'https://ai.test/v1', AI_MODEL: 'model-a', AI_API_KEY: 'key-1' });
	reply = () => Response.json({ choices: [{ message: { content: '{"ok": true}' } }] });
	assert.deepEqual(await ai.askJson({ system: 'sys', user: 'resume', schemaName: 'x', schema: { type: 'object' } }), { ok: true });
	assert.equal(sent[0].url, 'https://ai.test/v1/chat/completions');
	assert.equal(sent[0].headers.get('authorization'), 'Bearer key-1');
	assert.equal(JSON.parse(String(sent[0].body)).model, 'model-a');
});

test('ai: error messages say what to check, without technical details', async () => {
	await quiet(async () => {
		fake.env.AI_BASE_URL = 'http://localhost:11434/v1';
		assert.equal(ai.aiErrorMessage(new LlmError('unreachable', 'ECONNREFUSED')), 'The AI model isn’t responding. Check that Ollama is running, then try again.');
		fake.env.AI_BASE_URL = 'https://ai.test/v1';
		assert.equal(ai.aiErrorMessage(new LlmError('unreachable', 'timeout')), 'The AI service isn’t responding. Try again in a moment.');
		assert.equal(ai.aiErrorMessage(new LlmError('rejected', '401')), 'The AI service refused the request (check the model name, API key or quota).');
		assert.equal(ai.aiErrorMessage(new LlmError('bad_output', 'not json')), 'The AI couldn’t produce a usable answer this time. Try again.');
		assert.equal(ai.aiErrorMessage(new Error('anything else')), 'Something went wrong. Try again in a moment.');
	});
});

// a one-page PDF with the given lines of text, so resume reading runs on a real file
function pdfWithText(...lines: string[]) {
	const stream = `BT /F1 12 Tf 14 TL 72 720 Td ${lines.map((l) => `(${l}) Tj T*`).join(' ')} ET`;
	const objects = [
		'<< /Type /Catalog /Pages 2 0 R >>',
		'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
		'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
		`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
		'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
	];
	let pdf = '%PDF-1.4\n';
	const offsets = objects.map((body, i) => {
		const offset = pdf.length;
		pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
		return offset;
	});
	const xref = pdf.length;
	pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
	pdf += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
	pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
	return pdf;
}

test('ai: reads the text of a stored resume PDF', async () => {
	reply = () =>
		new Response(pdfWithText('Ana Tremblay', 'Software developer intern at Shopify, May to August 2024', 'Skills: Python, SQL, SvelteKit', 'Concordia University, Software Engineering'));
	const result = await ai.resumeText('user-1/abc.pdf');
	assert.ok('text' in result, JSON.stringify(result));
	assert.match(result.text, /Software developer intern at Shopify/);
	assert.equal(sent[0].url, 'https://project.supabase.test/storage/v1/object/resumes/user-1/abc.pdf');
});

test("ai: explains when the resume is missing, has no text, or isn't a readable PDF", async () => {
	reply = () => new Response('', { status: 404 });
	assert.deepEqual(await ai.resumeText('gone.pdf'), { error: 'The resume file is missing. Upload it again.' });
	reply = () => new Response(pdfWithText('Scan'));
	assert.deepEqual(await ai.resumeText('scan.pdf'), {
		error: 'This PDF has no readable text. It may be a scan or an image; export it from your editor as a text PDF.'
	});
	reply = () => new Response('this is not a pdf');
	assert.deepEqual(await quiet(() => ai.resumeText('broken.pdf')), { error: 'This PDF couldn’t be read. Try exporting it again.' });
});
