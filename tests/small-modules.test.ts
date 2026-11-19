import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { useFakes, resetFakes, fake, event } from './helpers/fakes.ts';

// The smaller modules no other test loads: the notifications database layer (US-26),
// the schools search proxy (US-04), profile completeness (US-04) and the form helper.
useFakes();
const { notificationService } = await import('../src/lib/server/notifications-db.ts');
const schools = await import('../src/routes/api/schools/+server.ts');
const { completeness } = await import('../src/lib/completeness.ts');
const { withPending } = await import('../src/lib/forms.ts');

beforeEach(resetFakes);

const user = { id: 'seeker-1' };
const notificationId = '11111111-1111-4111-8111-111111111111';

test('notifications: new ones are saved once per dedupe key', async () => {
	fake.db.results.push([{ id: notificationId }]);
	const created = await notificationService.createNotification({
		userId: 'seeker-1',
		type: 'status',
		title: 'Application update',
		message: 'You have an interview.',
		link: '/applications',
		dedupeKey: 'status:1'
	});
	assert.deepEqual(created, { id: notificationId });
	const [insert] = fake.db.queries;
	assert.equal(insert.table, 'notification');
	assert.deepEqual((insert.values as { userId: string }).userId, 'seeker-1');
	assert.ok(insert.conflict, 'a repeated dedupe key does nothing');

	// the insert returned no row: it was a duplicate
	assert.equal(await notificationService.createNotification({ userId: 'seeker-1', type: 't', title: 't', message: 'm' }), null);
});

test("notifications: reading, counting and marking read only touch the user's own", async () => {
	fake.db.results.push([{ id: notificationId }], [{ total: 2 }], [{ id: notificationId }], []);
	assert.deepEqual(await notificationService.getNotifications(user, 10), [{ id: notificationId }]);
	assert.equal(await notificationService.countUnreadNotifications(user), 2);
	assert.equal(await notificationService.markNotificationAsRead(user, notificationId), true);
	// someone else's notification: the scoped update finds nothing
	assert.equal(await notificationService.markNotificationAsRead(user, notificationId), false);
	assert.deepEqual(
		fake.db.queries.map((q) => q.params),
		[['seeker-1'], ['seeker-1'], [notificationId, 'seeker-1'], [notificationId, 'seeker-1']]
	);
});

test('schools: Canadian schools first, at most 8, with their province and website', async () => {
	const results = [
		{ name: 'Boston University', country: 'United States', 'state-province': 'MA', domains: ['bu.edu'] },
		{ name: 'Concordia University', country: 'Canada', 'state-province': 'Quebec', domains: ['concordia.ca'] },
		...Array.from({ length: 10 }, (_, i) => ({ name: `School ${i}`, country: 'France', 'state-province': null, domains: [`s${i}.fr`] }))
	];
	const requested: string[] = [];
	const fetchSchools = (async (url: string) => {
		requested.push(url);
		return Response.json(results);
	}) as typeof fetch;
	const e = { ...(event({ url: 'http://localhost/api/schools?q=con cordia' }) as object), fetch: fetchSchools } as never;
	const res = await schools.GET(e);
	const body = await res.json();
	assert.equal(requested[0], 'http://universities.hipolabs.com/search?name=con%20cordia');
	assert.equal(body.length, 8);
	assert.deepEqual(body[0], { label: 'Concordia University', detail: 'Quebec, Canada', domain: 'concordia.ca' });
	assert.deepEqual(body[2], { label: 'School 0', detail: 'France', domain: 's0.fr' });
	assert.equal(res.headers.get('cache-control'), 'public, max-age=86400');
});

test("schools: short searches don't call the API, and its failures give an empty list", async () => {
	let calls = 0;
	const failing = (async () => {
		calls++;
		throw new Error('offline');
	}) as unknown as typeof fetch;
	const ask = async (q: string, f: typeof fetch) =>
		(await schools.GET({ ...(event({ url: `http://localhost/api/schools?q=${q}` }) as object), fetch: f } as never)).json();
	assert.deepEqual(await ask('c', failing), []);
	assert.equal(calls, 0);
	assert.deepEqual(await ask('concordia', failing), []);
	assert.deepEqual(await ask('concordia', (async () => new Response('', { status: 503 })) as unknown as typeof fetch), []);
});

const emptyProfile = {
	headline: null,
	location: null,
	about: null,
	company: null,
	jobTitle: null,
	skills: [] as string[],
	jobTypes: [] as string[],
	desiredRoles: [] as string[]
};
const none = { experience: 0, education: 0, resumes: 0 };

test('completeness: counts what a job seeker has filled in and suggests the next step', () => {
	assert.deepEqual(completeness('job_seeker', null, null, none), { percent: 0, next: 'Add a headline' });
	const p = { ...emptyProfile, headline: 'Developer', location: 'Montréal', skills: ['a', 'b', 'c'], about: 'Hi', jobTypes: ['internship'] };
	const result = completeness('job_seeker', 'photo.png', p as never, { experience: 1, education: 1, resumes: 0 });
	assert.deepEqual(result, { percent: 89, next: 'Upload a resume' });
	assert.deepEqual(completeness('job_seeker', 'photo.png', p as never, { experience: 1, education: 1, resumes: 1 }), { percent: 100, next: null });
});

test('completeness: recruiters are checked on their company details instead', () => {
	const p = { ...emptyProfile, company: 'Acme', jobTitle: 'Recruiter' };
	assert.deepEqual(completeness('recruiter', null, p as never, none), { percent: 40, next: 'Add your location' });
});

test('withPending: shows the pending state while a form is sent, keeping what was typed', async () => {
	const states: boolean[] = [];
	let updatedWith: unknown;
	const submit = withPending((pending) => states.push(pending));
	const after = submit({} as never) as (opts: { update: (o: unknown) => Promise<void> }) => Promise<void>;
	assert.deepEqual(states, [true]);
	await after({ update: async (o) => void (updatedWith = o) });
	assert.deepEqual(states, [true, false]);
	assert.deepEqual(updatedWith, { reset: false });
});
