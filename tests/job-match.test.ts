import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { useFakes, resetFakes, fake, event, run, seeker, recruiter } from './helpers/fakes.ts';

// US-31: AI job matching, with the database and the AI model faked
useFakes();
const page = await import('../src/routes/(app)/matches/+page.server.ts');
const { canMatch, isMatchable, matchPrompt, normalizeMatches, shortlist } = await import('../src/lib/server/job-match.ts');
const { LlmError } = await import('../src/lib/server/llm.ts');

beforeEach(resetFakes);

const id = (n: number) => `${n}1111111-1111-4111-8111-111111111111`;
const job = (n: number, extra: object = {}) => ({
	id: id(n), title: `Job ${n}`, company: 'Acme', companyDomain: null, location: 'Montréal, QC', employmentType: 'full_time', workMode: 'hybrid',
	description: 'Build things.', requirements: 'Python', status: 'open', published: true, archived: false, applicationDeadline: '2099-01-01', createdBy: 'recruiter-1', ...extra
});
const details = { headline: 'Developer', about: null, skills: ['Python', 'SQL', 'Git'], desiredRoles: [], jobTypes: [], workModes: [], preferredLocations: [] };
const profile = { ...details, experience: [], education: [] };
const answer = (...matches: object[]) => ({ matches });
const m = (jobRef: string, level = 'good', extra: object = {}) => ({ jobRef, level, reason: 'Python fits.', missing: [], ...extra });
// the action's queries in order: experience, education, profile, applications, postings
const queue = (postings: object[], applied: object[] = [], info: object | undefined = details) => fake.db.results.push([], [], info ? [info] : [], applied, postings);
const go = (form: Record<string, string> = {}, user: object = seeker) => run(() => page.actions.run(event({ user, form })));

test('canMatch: needs a resume, 3 skills or an experience', () => {
	assert.equal(canMatch({ skills: ['Go'], experience: [] }, false), false);
	assert.equal(canMatch({ skills: ['Go'], experience: [] }, true), true);
	assert.equal(canMatch({ skills: ['a', 'b', 'c'], experience: [] }, false), true);
	assert.equal(canMatch({ skills: [], experience: [{ title: 't', company: 'c' }] }, false), true);
});

test('isMatchable: closed, unpublished, archived, past-deadline, applied and own postings are out', () => {
	const check = (extra: object, applied: string[] = []) => isMatchable(job(1, extra), 'seeker-1', new Set(applied), '2026-11-22');
	assert.equal(check({}), true);
	assert.equal(check({ applicationDeadline: null }), true);
	for (const extra of [{ status: 'closed' }, { published: false }, { archived: true }, { applicationDeadline: '2026-11-21' }, { createdBy: 'seeker-1' }]) {
		assert.equal(check(extra), false, JSON.stringify(extra));
	}
	assert.equal(check({}, [id(1)]), false);
});

test('shortlist: ranks on the candidate’s skills rather than common words', () => {
	const off = job(1, { title: 'Welder', requirements: 'Strong experience and good knowledge', description: 'Work with our team.' });
	const fit = job(2, { title: 'Python Developer', requirements: 'SQL' });
	assert.deepEqual(shortlist([off, fit], { ...profile, about: 'Strong experience working with a good team' }).map((j) => j.id), [id(2), id(1)]);
	assert.equal(shortlist([job(1), job(2), job(3)], profile, '', 2).length, 2);
});

test('matchPrompt: numbers the jobs, and leaves out ids and anything not passed in', () => {
	const prompt = matchPrompt(profile, 'RESUME TEXT', [job(1), job(2)], new Date('2026-11-22'));
	assert.match(prompt, /\[J1\] Job 1 at Acme/);
	assert.match(prompt, /\[J2\] Job 2/);
	assert.match(prompt, /RESUME TEXT/);
	assert.match(prompt, /2026-11-22/);
	assert.ok(!prompt.includes(id(1)));
});

test('normalizeMatches: keeps real jobs and valid levels only, each once, strongest first', () => {
	const jobs = [job(1), job(2), job(3)];
	const out = normalizeMatches(
		answer(m('J1', 'partial'), m('J9'), m('J2', 'amazing'), m('J3', 'strong'), m('J3', 'good'), m('J2', 'good', { reason: '  ' }), m('nope'), null as never),
		jobs
	);
	assert.deepEqual(out.map((x) => [x.jobId, x.level]), [[id(3), 'strong'], [id(1), 'partial']]);
});

test('normalizeMatches: drops "missing" skills the candidate has, caps the lists, and rejects bad output', () => {
	const [one] = normalizeMatches(answer(m('J1', 'good', { missing: ['python', 'Docker', '', 7, 'a', 'b', 'c', 'd', 'e'] })), [job(1)], ['Python']);
	assert.deepEqual(one.missing, ['Docker', 'a', 'b', 'c', 'd']);
	const many = Array.from({ length: 9 }, (_, i) => m(`J${i + 1}`));
	assert.equal(normalizeMatches(answer(...many), many.map((_, i) => job(i + 1))).length, 6);
	assert.deepEqual(normalizeMatches(answer(), [job(1)]), []);
	assert.throws(() => normalizeMatches({ jobs: [] }, [job(1)]), LlmError);
	assert.throws(() => normalizeMatches(null, [job(1)]), LlmError);
});

test('run: only eligible jobs reach the AI, and the result is saved for this user', async () => {
	queue([job(1), job(2), job(3, { applicationDeadline: '2020-01-01' })], [{ jobId: id(2) }]);
	fake.ai.askJson.impl = async () => answer(m('J1', 'strong'));
	assert.deepEqual(await go(), { kind: 'ok', data: { done: true } });
	const prompt = fake.ai.askJson.calls[0][0].user;
	assert.match(prompt, /Job 1/);
	assert.ok(!/Job 2|Job 3/.test(prompt));
	const saved = fake.db.queries.at(-1)!;
	assert.equal(saved.table, 'job_match');
	assert.ok(saved.conflict, 'refreshing replaces the saved row');
	const values = saved.values as { userId: string; matches: { jobId: string }[]; model: string; resumeId: null };
	assert.equal(values.userId, 'seeker-1');
	assert.equal(values.matches[0].jobId, id(1));
	assert.equal(values.model, 'test-model');
	assert.equal(values.resumeId, null);
});

test('run: a chosen resume must be your own, and its text goes to the AI', async () => {
	const rid = id(7);
	fake.db.results.push([{ id: rid, userId: 'seeker-1', storagePath: 'seeker-1/r.pdf' }]);
	queue([job(1)], [], undefined);
	fake.ai.resumeText.impl = async () => ({ text: 'Built APIs in Rust' });
	fake.ai.askJson.impl = async () => answer();
	assert.equal((await go({ resumeId: rid })).kind, 'ok');
	assert.deepEqual(fake.db.queries[0].params, [rid, 'seeker-1']);
	assert.match(fake.ai.askJson.calls[0][0].user, /Built APIs in Rust/);
	assert.equal((fake.db.queries.at(-1)!.values as { resumeId: string }).resumeId, rid);

	resetFakes();
	fake.db.results.push([]);
	assert.deepEqual(await go({ resumeId: rid }), { kind: 'fail', status: 404, data: { error: 'That resume no longer exists.' } });
	assert.equal(fake.ai.askJson.calls.length, 0);
});

test('run: clear messages for an empty profile, no AI, an unreadable resume, or an AI failure', async () => {
	queue([job(1)], [], { ...details, skills: ['Go'] });
	const empty = await go();
	assert.equal(empty.kind === 'fail' && empty.data.emptyProfile, true);
	assert.equal(fake.ai.askJson.calls.length, 0);

	resetFakes();
	fake.ai.aiConfigured.impl = () => false;
	assert.deepEqual(await go(), { kind: 'fail', status: 503, data: { error: 'AI features aren’t set up on this server.' } });

	resetFakes();
	fake.db.results.push([{ id: id(7), storagePath: 'x.pdf' }]);
	queue([job(1)]);
	fake.ai.resumeText.impl = async () => ({ error: 'This PDF has no readable text.' });
	assert.deepEqual(await go({ resumeId: id(7) }), { kind: 'fail', status: 400, data: { error: 'This PDF has no readable text.' } });

	resetFakes();
	queue([job(1)]);
	fake.ai.askJson.impl = async () => {
		throw new Error('offline');
	};
	assert.deepEqual(await go(), { kind: 'fail', status: 502, data: { error: 'AI failed: offline' } });
	assert.ok(!fake.db.queries.some((q) => q.table === 'job_match' && q.op === 'insert'), 'a failure keeps the previous matches');
});

test('run: with no eligible jobs it saves an empty result without calling the AI', async () => {
	queue([job(1, { status: 'closed' })]);
	assert.equal((await go()).kind, 'ok');
	assert.equal(fake.ai.askJson.calls.length, 0);
	assert.deepEqual((fake.db.queries.at(-1)!.values as { matches: unknown[] }).matches, []);
});

test('recruiters can’t use job matches', async () => {
	assert.deepEqual(await run(() => page.load(event({ user: recruiter }))), { kind: 'error', status: 404, message: 'Not found' });
	assert.equal((await go({}, recruiter) as { status: number }).status, 403);
	assert.equal(fake.db.queries.length, 0);
});

test('load: shows your saved matches, minus jobs that closed or that you applied to since', async () => {
	const stored = [1, 2, 3, 4].map((n) => ({ jobId: id(n), level: 'good', reason: 'Fits.', missing: [] }));
	const updatedAt = new Date('2026-11-20');
	fake.db.results.push(
		[{ userId: 'seeker-1', resumeId: null, matches: stored, model: 'test-model', updatedAt }],
		[{ id: id(8), fileName: 'cv.pdf' }],
		[job(1), job(2, { status: 'closed' }), job(3)], // job 4 was deleted
		[{ jobId: id(3) }]
	);
	const data = (await page.load(event({ user: seeker }))) as { matches: { job: Record<string, unknown> }[]; saved: unknown; ai: unknown; resumes: unknown[] };
	assert.deepEqual(data.matches.map((x) => x.job.id), [id(1)]);
	assert.equal(data.matches[0].job.description, undefined);
	assert.deepEqual(data.saved, { resumeId: null, model: 'test-model', updatedAt });
	assert.equal(data.resumes.length, 1);
	assert.deepEqual(fake.db.queries[0].params, ['seeker-1']);
});

test('load: nothing saved yet', async () => {
	const data = (await page.load(event({ user: seeker }))) as { matches: unknown[]; saved: unknown };
	assert.deepEqual(data.matches, []);
	assert.equal(data.saved, null);
});
