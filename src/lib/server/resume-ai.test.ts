// Run with: pnpm test. The AI provider is faked, so no model is needed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { completeJson, extractJson, LlmError } from './llm.ts';
import { normalizeParsed, normalizeReview, resumePrompt, RESUME_TEXT_LIMIT } from './resume-ai.ts';

const config = { baseUrl: 'http://ai.test/v1/', model: 'm', apiKey: 'secret' };
const request = { system: 's', user: 'u', schemaName: 'x', schema: { type: 'object' } };
const answer = (content: string, status = 200) =>
	new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status });

test('llm: JSON is pulled out of reasoning tags, code fences and chatter', () => {
	assert.deepEqual(extractJson('<think>{"not": "this"}</think>Sure!\n```json\n{"a": 1}\n```'), { a: 1 });
	assert.throws(() => extractJson('no json here'), LlmError);
	assert.throws(() => extractJson('{"a": '), LlmError);
});

test('llm: sends the key, asks for schema output, and falls back to plain JSON mode on a 400', async () => {
	const calls: { url: string; auth: string | null; body: Record<string, any> }[] = [];
	const fake = (async (url: any, init: any) => {
		calls.push({ url: String(url), auth: new Headers(init.headers).get('authorization'), body: JSON.parse(init.body) });
		return calls.length === 1 ? new Response('unsupported', { status: 400 }) : answer('{"ok": true}');
	}) as typeof fetch;

	assert.deepEqual(await completeJson(config, request, fake), { ok: true });
	assert.equal(calls[0].url, 'http://ai.test/v1/chat/completions');
	assert.equal(calls[0].auth, 'Bearer secret');
	assert.equal(calls[0].body.response_format.type, 'json_schema');
	assert.equal(calls[1].body.response_format.type, 'json_object');
	assert.equal(calls[1].body.reasoning_effort, undefined);
});

test('llm: failures are classified for the user-facing message', async () => {
	const down = (async () => { throw new TypeError('fetch failed'); }) as typeof fetch;
	await assert.rejects(completeJson(config, request, down), (e: LlmError) => e.kind === 'unreachable');

	const unauthorized = (async () => new Response('bad key', { status: 401 })) as typeof fetch;
	await assert.rejects(completeJson(config, request, unauthorized), (e: LlmError) => e.kind === 'rejected');

	const empty = (async () => answer('')) as typeof fetch;
	await assert.rejects(completeJson(config, request, empty), (e: LlmError) => e.kind === 'bad_output');
});

const today = new Date('2026-10-07');

test('autofill: model output becomes validated profile data', () => {
	const parsed = normalizeParsed(
		{
			headline: ' 3rd-year student ',
			phone: 'call me maybe',
			githubUrl: 'github.com/ada',
			skills: ['TypeScript', 'typescript', 'x'.repeat(60), 42],
			experience: [
				{ title: 'Intern', company: 'Shopify', employmentType: 'internship', startDate: '2026-05', endDate: '2026-08', current: false, bullets: ['- Built things', 'Tested things'] },
				{ title: 'TA', company: 'Concordia', employmentType: 'wizard', startDate: '2025', endDate: null, current: true, bullets: [] }
			],
			education: [{ school: 'Concordia University', degree: 'BEng', fieldOfStudy: null, startYear: 2023, endYear: 2027, description: null }]
		},
		today
	);
	assert.deepEqual(parsed.profile, { headline: '3rd-year student', githubUrl: 'https://github.com/ada' });
	assert.deepEqual(parsed.skills, ['TypeScript']);
	assert.equal(parsed.experience[0].description, '• Built things\n• Tested things');
	assert.equal(parsed.experience[0].endDate, '2026-08-01');
	// year-only start becomes January; unknown employment type is dropped; current roles have no end date
	assert.deepEqual(
		[parsed.experience[1].startDate, parsed.experience[1].endDate, parsed.experience[1].employmentType],
		['2025-01-01', null, null]
	);
	assert.equal(parsed.education[0].endYear, 2027);
	assert.equal(parsed.skipped, 0);
});

test('autofill: entries that fail profile validation are left out and counted', () => {
	const parsed = normalizeParsed(
		{
			experience: [
				{ title: '', company: 'Nowhere', startDate: '2024-01', endDate: '2024-06', current: false, bullets: [] },
				{ title: 'Time traveller', company: 'Acme', startDate: '2031-01', endDate: null, current: true, bullets: [] },
				{ title: 'Backwards', company: 'Acme', startDate: '2024-06', endDate: '2024-01', current: false, bullets: [] },
				'not an object'
			],
			education: [{ school: '', startYear: 2020, endYear: 2024 }, { school: 'X', startYear: 2024, endYear: 2020 }]
		},
		today
	);
	assert.equal(parsed.experience.length, 0);
	assert.equal(parsed.education.length, 0);
	assert.equal(parsed.skipped, 6);
	// garbage in, empty result out: never throws
	assert.deepEqual(normalizeParsed('nonsense', today), { profile: {}, skills: [], experience: [], education: [], skipped: 0 });
});

test('review: output is trimmed, capped, and rejected when empty', () => {
	const review = normalizeReview({
		summary: ' Solid resume. ',
		strengths: ['a', 'b', 'c', 'd', 'e', 'f', ''],
		improvements: [{ section: 'Experience', issue: 'Vague', suggestion: 'Add numbers' }, { section: 'Skills', issue: '', suggestion: 'x' }],
		rewrites: [{ original: 'Did stuff', improved: 'Built X' }, { original: 'only one side' }],
		missingKeywords: ['Docker', 7],
		jobFit: ''
	});
	assert.equal(review.summary, 'Solid resume.');
	assert.equal(review.strengths.length, 4);
	assert.equal(review.improvements.length, 1);
	assert.equal(review.rewrites.length, 1);
	assert.deepEqual(review.missingKeywords, ['Docker']);
	assert.equal(review.jobFit, null);
	assert.throws(() => normalizeReview({ summary: 'Fine', strengths: [], improvements: [] }), LlmError);
});

test('prompt: includes today’s date and caps very long resumes', () => {
	const prompt = resumePrompt('x'.repeat(RESUME_TEXT_LIMIT + 500), today);
	assert.match(prompt, /Today's date is 2026-10-07/);
	assert.ok(prompt.length < RESUME_TEXT_LIMIT + 100);
});
