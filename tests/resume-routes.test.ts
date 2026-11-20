import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { useFakes, resetFakes, fake, event, run, seeker, recruiter, file } from './helpers/fakes.ts';

// US-10, US-11, US-24: the resume pages, the PDF download and the two AI features,
// with storage and the AI model faked
useFakes();
const list = await import('../src/routes/(app)/resumes/+page.server.ts');
const download = await import('../src/routes/(app)/resumes/[id]/+server.ts');
const review = await import('../src/routes/(app)/resumes/[id]/review/+page.server.ts');
const importPage = await import('../src/routes/(app)/resumes/[id]/import/+page.server.ts');
const { findOwnResume } = await import('../src/lib/server/resumes.ts');

beforeEach(resetFakes);

const id = '11111111-1111-4111-8111-111111111111';
const jobId = '22222222-2222-4222-8222-222222222222';
const pdf = () => file('Ana Resume.pdf', 'application/pdf');
const row = { id, userId: 'seeker-1', fileName: 'Ana Resume.pdf', storagePath: 'seeker-1/abc.pdf', parsed: null, review: null, reviewedAt: null };
const quiet = async <T>(fn: () => Promise<T>) => {
	const errorLog = console.error;
	console.error = () => {};
	try {
		return await fn();
	} finally {
		console.error = errorLog;
	}
};

test('resume list: job seekers see their own resumes; recruiters get "not found"', async () => {
	fake.db.results.push([{ id, fileName: 'Ana Resume.pdf' }]);
	assert.deepEqual(await list.load(event({ user: seeker })), { resumes: [{ id, fileName: 'Ana Resume.pdf' }], ai: true });
	assert.deepEqual(fake.db.queries[0].params, ['seeker-1']);
	assert.deepEqual(await run(() => list.load(event({ user: recruiter }))), { kind: 'error', status: 404, message: 'Not found' });
});

test('upload: a PDF is stored under a path made from ids only, and confirmed', async () => {
	fake.db.results.push([{ total: 0 }]);
	const r = await run(() => list.actions.upload(event({ user: seeker, form: { file: file('../../etc/My CV.pdf', 'application/pdf') } })));
	assert.deepEqual(r, { kind: 'ok', data: { success: 'My CV.pdf uploaded.' } });
	const [path] = fake.storage.uploadResume.calls[0];
	assert.match(path, /^seeker-1\/[0-9a-f-]{36}\.pdf$/);
	const inserted = fake.db.queries[1].values as Record<string, unknown>;
	assert.equal(inserted.userId, 'seeker-1');
	assert.equal(inserted.storagePath, path);
	assert.equal(inserted.fileName, 'My CV.pdf');
});

test('upload: refused for recruiters, non-PDFs and when 5 resumes are already stored', async () => {
	const cases: [object, Record<string, File>, number, string][] = [
		[recruiter, { file: pdf() }, 403, 'Only job seekers can upload resumes.'],
		[seeker, { file: file('cv.docx', 'application/msword', 'PK..') }, 400, 'Only PDF files are accepted.'],
		[seeker, { file: file('fake.pdf', 'application/pdf', 'PK.. a renamed Word file') }, 400, 'Only PDF files are accepted.']
	];
	for (const [user, form, status, error] of cases) {
		assert.deepEqual(await run(() => list.actions.upload(event({ user, form }))), { kind: 'fail', status, data: { error } });
	}
	fake.db.results.push([{ total: 5 }]);
	const full = await run(() => list.actions.upload(event({ user: seeker, form: { file: pdf() } })));
	assert.equal(full.kind === 'fail' && full.data.error, 'You can keep up to 5 resumes. Delete one to upload another.');
	assert.equal(fake.storage.uploadResume.calls.length, 0);
});

test("upload: a storage failure saves nothing, and a database failure doesn't leave the file behind", async () => {
	fake.storage.uploadResume.impl = async () => {
		throw new Error('storage down');
	};
	fake.db.results.push([{ total: 0 }]);
	const r = await quiet(() => run(() => list.actions.upload(event({ user: seeker, form: { file: pdf() } }))));
	assert.deepEqual(r, { kind: 'fail', status: 500, data: { error: 'The file could not be saved. Try again in a moment.' } });
	assert.equal(fake.db.queries.filter((q) => q.op === 'insert').length, 0);

	resetFakes();
	fake.db.results.push([{ total: 0 }]);
	const insert = fake.db.insert;
	fake.db.insert = (() => {
		throw new Error('db down');
	}) as typeof insert;
	await quiet(() => assert.rejects(run(() => list.actions.upload(event({ user: seeker, form: { file: pdf() } }))), /db down/));
	fake.db.insert = insert;
	assert.equal(fake.storage.deleteResume.calls[0][0], fake.storage.uploadResume.calls[0][0]);
});

test("replace: overwrites the user's own file and clears the old AI results", async () => {
	fake.db.results.push([row]);
	const r = await run(() => list.actions.replace(event({ user: seeker, form: { id, file: file('New CV.pdf', 'application/pdf') } })));
	assert.deepEqual(r, { kind: 'ok', data: { success: 'Ana Resume.pdf replaced with New CV.pdf.' } });
	assert.deepEqual(fake.db.queries[0].params, [id, 'seeker-1']);
	assert.equal(fake.storage.uploadResume.calls[0][0], 'seeker-1/abc.pdf');
	const set = fake.db.queries[1].set!;
	assert.equal(set.fileName, 'New CV.pdf');
	assert.deepEqual([set.parsed, set.parsedAt, set.review, set.reviewedAt], [null, null, null, null]);
});

test("replace and delete: someone else's resume, or a bad id, is treated as missing", async () => {
	for (const action of [list.actions.replace, list.actions.delete]) {
		fake.db.results.push([]); // the query is scoped to the user, so another user's resume isn't found
		const r = await run(() => action(event({ user: seeker, form: { id, file: pdf() } })));
		assert.deepEqual(r, { kind: 'fail', status: 404, data: { error: 'That resume no longer exists.' } });
		const bad = await run(() => action(event({ user: seeker, form: { id: 'x', file: pdf() } })));
		assert.equal(bad.kind === 'fail' && bad.status, 404);
	}
	assert.equal(fake.storage.uploadResume.calls.length + fake.storage.deleteResume.calls.length, 0);
});

test('delete: removes the row and then the file', async () => {
	fake.db.results.push([row]);
	assert.deepEqual(await run(() => list.actions.delete(event({ user: seeker, form: { id } }))), { kind: 'ok', data: { success: 'Ana Resume.pdf deleted.' } });
	assert.deepEqual(fake.db.queries[1].op, 'delete');
	assert.deepEqual(fake.storage.deleteResume.calls, [['seeker-1/abc.pdf']]);
});

const get = (user: object, resumeId = id) => run(() => download.GET(event({ user, params: { id: resumeId } })));

test('download: the owner gets the PDF inline, never cached or sniffed', async () => {
	fake.db.results.push([row]);
	const r = await get(seeker);
	assert.equal(r.kind, 'ok');
	const res = (r as { data: Response }).data;
	assert.equal(res.headers.get('content-type'), 'application/pdf');
	assert.equal(res.headers.get('content-disposition'), "inline; filename*=UTF-8''Ana%20Resume.pdf");
	assert.equal(res.headers.get('cache-control'), 'private, no-store');
	assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
	assert.equal(await res.text(), '%PDF-1.7 file');
});

test('download: another job seeker, or a recruiter the resume was never sent to, gets "not found"', async () => {
	const notFound = { kind: 'error', status: 404, message: 'Resume not found' };
	// even if an application row came back, another job seeker never gets through
	fake.db.results.push([row], [{ id: 'application-1' }]);
	assert.deepEqual(await get({ ...seeker, id: 'seeker-2' }), notFound);
	fake.db.reset();
	fake.db.results.push([row], []); // no application with this resume on the recruiter's postings
	assert.deepEqual(await get(recruiter), notFound);
	assert.deepEqual(fake.db.queries.at(-1)!.params, [id, 'seeker-1', 'recruiter-1']);
	assert.deepEqual(await get(seeker, 'not-a-uuid'), notFound);
	fake.db.results.push([]);
	assert.deepEqual(await get(seeker), notFound);
	fake.storage.downloadResume.impl = async () => null;
	fake.db.results.push([row]);
	assert.deepEqual(await get(seeker), notFound);
});

test('download: a recruiter can open a resume sent with an application to their posting', async () => {
	fake.db.results.push([row], [{ id: 'application-1' }]);
	assert.equal((await get(recruiter)).kind, 'ok');
});

test('findOwnResume: checks the id format, then looks only in the user’s resumes', async () => {
	assert.equal(await findOwnResume('nope', 'seeker-1'), null);
	assert.equal(fake.db.queries.length, 0);
	fake.db.results.push([row]);
	assert.deepEqual(await findOwnResume(id, 'seeker-1'), row);
	assert.deepEqual(fake.db.queries[0].params, [id, 'seeker-1']);
});

// --- AI resume review (US-24) ---

test('review page: shows the saved review and the postings to tailor it to', async () => {
	fake.db.results.push([row], [{ id: jobId, title: 'Junior Developer', company: 'Acme' }]);
	const data = await review.load(event({ user: seeker, params: { id } }));
	assert.deepEqual(data, {
		resume: { id, fileName: 'Ana Resume.pdf', review: null, reviewedAt: null },
		jobs: [{ id: jobId, title: 'Junior Developer', company: 'Acme' }],
		ai: { configured: true, local: true }
	});
	fake.db.results.push([]);
	assert.deepEqual(await run(() => review.load(event({ user: seeker, params: { id } }))), { kind: 'error', status: 404, message: 'Resume not found' });
});

const aiReview = { summary: 'Clear and focused.', strengths: ['Concrete results'], improvements: [], rewrites: [], missingKeywords: [] };

test('review: tailored to a job, saved with the job and the model name', async () => {
	fake.ai.askJson.impl = async () => aiReview;
	fake.db.results.push([row], [{ id: jobId, title: 'Junior Developer', company: 'Acme', description: 'Build APIs', requirements: 'TypeScript' }]);
	const r = await run(() => review.actions.run(event({ user: seeker, params: { id }, form: { jobId } })));
	assert.deepEqual(r, { kind: 'ok', data: { done: true } });
	assert.equal(fake.ai.resumeText.calls[0][0], 'seeker-1/abc.pdf');
	assert.match(fake.ai.askJson.calls[0][0].system, /Junior Developer/);
	const saved = fake.db.queries.at(-1)!.set!.review as Record<string, unknown>;
	assert.equal(saved.summary, 'Clear and focused.');
	assert.deepEqual(saved.job, { id: jobId, title: 'Junior Developer', company: 'Acme' });
	assert.equal(saved.model, 'test-model');
});

test("review: clear errors when the AI isn't set up, the PDF can't be read, or the AI fails", async () => {
	fake.db.results.push([row]);
	fake.ai.aiConfigured.impl = () => false;
	let r = await run(() => review.actions.run(event({ user: seeker, params: { id }, form: {} })));
	assert.deepEqual(r, { kind: 'fail', status: 503, data: { error: 'AI features aren’t set up on this server.' } });

	fake.ai.aiConfigured.impl = () => true;
	fake.ai.resumeText.impl = async () => ({ error: 'This PDF has no readable text.' });
	fake.db.results.push([row]);
	r = await run(() => review.actions.run(event({ user: seeker, params: { id }, form: {} })));
	assert.deepEqual(r, { kind: 'fail', status: 400, data: { error: 'This PDF has no readable text.' } });

	fake.ai.resumeText.impl = async () => ({ text: 'resume text' });
	fake.ai.askJson.impl = async () => {
		throw new Error('model offline');
	};
	fake.db.results.push([row]);
	r = await run(() => review.actions.run(event({ user: seeker, params: { id }, form: {} })));
	assert.deepEqual(r, { kind: 'fail', status: 502, data: { error: 'AI failed: model offline' } });
	assert.equal(fake.db.queries.filter((q) => q.op === 'update').length, 0);

	fake.db.results.push([]);
	r = await run(() => review.actions.run(event({ user: seeker, params: { id }, form: {} })));
	assert.equal(r.kind === 'fail' && r.status, 404);
});

// --- fill profile from resume (US-24) ---

const parsed = {
	profile: { headline: 'Developer', location: 'Montréal' },
	skills: ['Python', 'SQL'],
	experience: [
		{ title: 'Developer intern', company: 'Shopify', startDate: '2024-05-01', endDate: '2024-08-01', current: false },
		{ title: 'Tutor', company: 'Concordia', startDate: '2023-01-01', endDate: null, current: true }
	],
	education: [{ school: 'Concordia University', degree: "Bachelor's", startYear: 2023, endYear: 2027 }],
	skipped: 0
};
const shopify = { title: 'developer intern', company: 'SHOPIFY', startDate: '2024-05-01' };

test('fill profile page: marks jobs and schools already on the profile', async () => {
	// resume, then loadEntries (experience, education)
	fake.db.results.push([{ ...row, parsed }], [shopify], []);
	const data = (await importPage.load(event({ user: seeker, params: { id } }))) as { duplicates: unknown };
	assert.deepEqual(data.duplicates, { experience: [true, false], education: [false] });
	fake.db.results.push([]);
	assert.equal((await run(() => importPage.load(event({ user: seeker, params: { id } })))).kind, 'error');
});

test('fill profile: reading the resume saves what the AI found, without touching the profile', async () => {
	fake.ai.askJson.impl = async () => ({ headline: 'Developer', skills: ['Python'], experience: [], education: [] });
	fake.db.results.push([row]);
	assert.deepEqual(await run(() => importPage.actions.extract(event({ user: seeker, params: { id }, form: {} }))), { kind: 'ok', data: { done: true } });
	const update = fake.db.queries.at(-1)!;
	assert.equal(update.table, 'resume');
	assert.equal((update.set!.parsed as { profile: { headline: string } }).profile.headline, 'Developer');
	assert.ok(!fake.db.queries.some((q) => ['profile', 'experience', 'education'].includes(q.table!)));

	fake.ai.askJson.impl = async () => {
		throw new Error('timeout');
	};
	fake.db.results.push([row]);
	const failed = await run(() => importPage.actions.extract(event({ user: seeker, params: { id }, form: {} })));
	assert.deepEqual(failed, { kind: 'fail', status: 502, data: { error: 'AI failed: timeout' } });
});

test('fill profile: adds only the ticked items, skipping duplicates and skills already there', async () => {
	// resume, loadEntries (Shopify is already on the profile), current skills
	fake.db.results.push([{ ...row, parsed }], [shopify], [], [{ skills: ['python'] }]);
	const form = { field: ['headline'], experience: ['0', '1'], education: ['0'], skills: 'on' };
	assert.deepEqual(await run(() => importPage.actions.import(event({ user: seeker, params: { id }, form }))), {
		kind: 'redirect',
		status: 303,
		location: '/profile?saved'
	});
	const writes = fake.db.queries.filter((q) => q.op === 'insert');
	const profileWrite = writes.find((q) => q.table === 'profile')!.values as Record<string, unknown>;
	assert.deepEqual(profileWrite, { userId: 'seeker-1', headline: 'Developer', skills: ['python', 'SQL'] });
	assert.deepEqual(
		(writes.find((q) => q.table === 'experience')!.values as { title: string }[]).map((e) => e.title),
		['Tutor']
	);
	assert.equal((writes.find((q) => q.table === 'education')!.values as unknown[]).length, 1);
});

test('fill profile: refused before reading the resume, or with nothing ticked', async () => {
	fake.db.results.push([row]);
	const unread = await run(() => importPage.actions.import(event({ user: seeker, params: { id }, form: { field: 'headline' } })));
	assert.deepEqual(unread, { kind: 'fail', status: 400, data: { error: 'Read the resume first.' } });
	fake.db.results.push([{ ...row, parsed }], [], []);
	const none = await run(() => importPage.actions.import(event({ user: seeker, params: { id }, form: {} })));
	assert.deepEqual(none, { kind: 'fail', status: 400, data: { error: 'Tick at least one item to add.' } });
	assert.equal(fake.db.queries.filter((q) => q.op === 'insert').length, 0);
});
