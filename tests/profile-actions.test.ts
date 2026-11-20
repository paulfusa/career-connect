import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { APIError } from 'better-auth/api';
import { useFakes, resetFakes, fake, spy, event, run, seeker, recruiter, file } from './helpers/fakes.ts';

// US-04: the profile page's load and actions. Every write must be scoped to locals.user.id,
// never to an id sent by the form alone.
useFakes();
const { load, actions } = await import('../src/routes/(app)/profile/+page.server.ts');
const home = await import('../src/routes/(app)/+page.server.ts');

beforeEach(resetFakes);

const saved = { kind: 'redirect', status: 303, location: '/profile?saved' };
const entryId = '11111111-1111-4111-8111-111111111111';
const quiet = async <T>(fn: () => Promise<T>) => {
	const errorLog = console.error;
	console.error = () => {};
	try {
		return await fn();
	} finally {
		console.error = errorLog;
	}
};

test('load: entries, resumes and follow counts for the signed-in user only', async () => {
	// loadEntries (experience, education), resumes, followers, following
	fake.db.results.push([], [], [{ id: 'r1', fileName: 'cv.pdf', storagePath: 'seeker-1/r1.pdf' }], [{ count: 3 }], [{ count: 1 }]);
	const data = await load(event({ user: seeker }));
	assert.deepEqual(data, { experience: [], education: [], resumes: [{ id: 'r1', fileName: 'cv.pdf' }], followers: 3, following: 1 });
	assert.ok(fake.db.queries.every((q) => q.params?.includes('seeker-1')));
	// the storage path stays on the server
	assert.ok(!JSON.stringify(data).includes('storagePath'));
});

test('intro: saves the name and profile fields, then goes back to the profile', async () => {
	const r = await run(() => actions.intro(event({ user: seeker, form: { name: 'Ana T.', location: 'Montréal', phone: '+1 514 555 0123' } })));
	assert.deepEqual(r, saved);
	const [userUpdate, profileUpsert] = fake.db.queries;
	assert.equal(userUpdate.table, 'user');
	assert.deepEqual(userUpdate.set, { name: 'Ana T.' });
	assert.deepEqual(userUpdate.params, ['seeker-1']);
	assert.equal(profileUpsert.table, 'profile');
	assert.equal((profileUpsert.values as { userId: string }).userId, 'seeker-1');
	assert.equal((profileUpsert.values as { location: string }).location, 'Montréal');
	assert.equal(fake.storage.uploadAvatar.calls.length, 0);
});

test('intro: a valid photo is uploaded and saved as the user image', async () => {
	const r = await run(() => actions.intro(event({ user: seeker, form: { name: 'Ana', avatar: file('me.png', 'image/png') } })));
	assert.deepEqual(r, saved);
	assert.equal(fake.storage.uploadAvatar.calls[0][0], 'seeker-1');
	assert.deepEqual(fake.db.queries[0].set, { name: 'Ana', image: 'https://storage.test/avatars/seeker-1/avatar' });
});

test('intro: required fields, bad phone numbers and bad photos are refused without saving', async () => {
	const cases: [Record<string, string | File>, string, string][] = [
		[{ name: '' }, 'name', 'Name is required.'],
		[{ name: 'Ana', phone: 'call me' }, 'phone', 'Enter a valid phone number, e.g. +1 514 555 0123.'],
		[{ name: 'Ana', avatar: file('me.gif', 'image/gif') }, 'avatar', 'Upload a PNG, JPG or WebP image.'],
		[{ name: 'Ana', avatar: file('big.png', 'image/png', new Uint8Array(2 * 1024 * 1024 + 1)) }, 'avatar', 'Use an image under 2 MB.']
	];
	for (const [form, field, message] of cases) {
		const r = await run(() => actions.intro(event({ user: seeker, form })));
		assert.equal(r.kind === 'fail' && r.status, 400, field);
		assert.equal(r.kind === 'fail' && (r.data.errors as Record<string, string>)[field], message);
	}
	assert.equal(fake.db.queries.length, 0);
	assert.equal(fake.storage.uploadAvatar.calls.length, 0);
});

test("intro: if the photo can't be uploaded, nothing is saved", async () => {
	fake.storage.uploadAvatar.impl = async () => {
		throw new Error('storage down');
	};
	const r = await quiet(() => run(() => actions.intro(event({ user: seeker, form: { name: 'Ana', avatar: file('me.png', 'image/png') } }))));
	assert.equal(r.kind === 'fail' && r.status, 500);
	assert.equal(fake.db.queries.length, 0);
});

test('about, skills and preferences: each saves its own section of the profile', async () => {
	assert.deepEqual(await run(() => actions.about(event({ user: seeker, form: { about: 'I build things.' } }))), saved);
	assert.deepEqual(await run(() => actions.skills(event({ user: seeker, form: { skills: ['Python', 'SQL'], topSkills: ['Python', 'Go'] } }))), saved);
	assert.deepEqual(await run(() => actions.preferences(event({ user: seeker, form: { openToWork: 'on', jobTypes: ['internship', 'made-up'] } }))), saved);

	const [about, skills, preferences] = fake.db.queries.map((q) => q.values as Record<string, unknown>);
	assert.deepEqual(about, { userId: 'seeker-1', about: 'I build things.' });
	// a top skill must be one of your skills
	assert.deepEqual(skills, { userId: 'seeker-1', skills: ['Python', 'SQL'], topSkills: ['Python'] });
	// unknown choices are dropped
	assert.equal(preferences.openToWork, true);
	assert.deepEqual(preferences.jobTypes, ['internship']);

	const tooLong = await run(() => actions.about(event({ user: seeker, form: { about: 'x'.repeat(2001) } })));
	assert.equal(tooLong.kind === 'fail' && tooLong.data.section, 'about');
});

const job = { title: 'Developer intern', company: 'Shopify', startDate: '2024-05', endDate: '2024-08' };
const school = { school: 'Concordia University', degree: "Bachelor's", startYear: '2023', endYear: '2027' };

test('experience and education: new entries are added for the signed-in user', async () => {
	assert.deepEqual(await run(() => actions.saveExperience(event({ user: seeker, form: job }))), saved);
	assert.deepEqual(await run(() => actions.saveEducation(event({ user: seeker, form: school }))), saved);
	const [exp, edu] = fake.db.queries;
	assert.equal(exp.op, 'insert');
	assert.equal(exp.table, 'experience');
	assert.equal((exp.values as { userId: string; startDate: string }).userId, 'seeker-1');
	assert.equal((exp.values as { startDate: string }).startDate, '2024-05-01');
	assert.equal(edu.table, 'education');
	assert.equal((edu.values as { startYear: number }).startYear, 2023);
});

test("experience and education: editing or deleting an entry only touches the user's own row", async () => {
	await run(() => actions.saveExperience(event({ user: seeker, form: { ...job, id: entryId } })));
	await run(() => actions.saveEducation(event({ user: seeker, form: { ...school, id: entryId } })));
	await run(() => actions.deleteExperience(event({ user: seeker, form: { id: entryId } })));
	await run(() => actions.deleteEducation(event({ user: seeker, form: { id: entryId } })));
	assert.deepEqual(
		fake.db.queries.map((q) => [q.op, q.table, q.params]),
		[
			['update', 'experience', [entryId, 'seeker-1']],
			['update', 'education', [entryId, 'seeker-1']],
			['delete', 'experience', [entryId, 'seeker-1']],
			['delete', 'education', [entryId, 'seeker-1']]
		]
	);

	// a malformed id deletes nothing
	fake.db.reset();
	assert.deepEqual(await run(() => actions.deleteExperience(event({ user: seeker, form: { id: 'not-an-id' } }))), saved);
	assert.equal(fake.db.queries.length, 0);
});

test('experience and education: invalid dates are refused without saving', async () => {
	const backwards = await run(() => actions.saveExperience(event({ user: seeker, form: { ...job, endDate: '2024-01' } })));
	assert.equal(backwards.kind === 'fail' && (backwards.data.errors as Record<string, string>).endDate, 'End date must be after the start date.');
	const noEnd = await run(() => actions.saveExperience(event({ user: seeker, form: { ...job, endDate: '' } })));
	assert.equal(noEnd.kind === 'fail' && (noEnd.data.errors as Record<string, string>).endDate, 'Add an end date, or tick “I currently work here”.');
	const years = await run(() => actions.saveEducation(event({ user: seeker, form: { ...school, endYear: '2020' } })));
	assert.equal(years.kind === 'fail' && (years.data.errors as Record<string, string>).endYear, 'End year must be after the start year.');
	assert.equal(fake.db.queries.length, 0);
});

test('email: changes through Better Auth, after checking the new address', async () => {
	const changeEmail = (fake.auth.api.changeEmail = spy<[{ body: unknown }], Promise<unknown>>(async () => ({})));
	assert.deepEqual(await run(() => actions.email(event({ user: seeker, form: { email: 'New@Example.com' } }))), {
		kind: 'ok',
		data: { section: 'email', saved: true }
	});
	assert.deepEqual(changeEmail.calls[0][0].body, { newEmail: 'new@example.com' });

	const messages = [];
	for (const email of ['nope', 'ana@example.com']) {
		const r = await run(() => actions.email(event({ user: seeker, form: { email } })));
		messages.push(r.kind === 'fail' && r.data.message);
	}
	assert.deepEqual(messages, ['Enter a valid email address.', 'That is already your email.']);

	fake.auth.api.changeEmail = spy(async () => {
		throw new APIError('BAD_REQUEST', { message: 'Email already in use' });
	});
	const taken = await run(() => actions.email(event({ user: seeker, form: { email: 'ben@example.com' } })));
	assert.equal(taken.kind === 'fail' && taken.data.message, 'Email already in use');
});

test('password: needs the current password and a confirmed new one of 8+ characters', async () => {
	const changePassword = (fake.auth.api.changePassword = spy<[{ body: unknown }], Promise<unknown>>(async () => ({})));
	const ok = { currentPassword: 'old-password', newPassword: 'new-password', confirmPassword: 'new-password' };
	assert.deepEqual(await run(() => actions.password(event({ user: seeker, form: ok }))), { kind: 'ok', data: { section: 'password', saved: true } });
	assert.deepEqual(changePassword.calls[0][0].body, { currentPassword: 'old-password', newPassword: 'new-password', revokeOtherSessions: true });

	const cases: [Record<string, string>, string][] = [
		[{ ...ok, currentPassword: '' }, 'Fill in your current and new password.'],
		[{ ...ok, newPassword: 'short', confirmPassword: 'short' }, 'Use a new password with at least 8 characters.'],
		[{ ...ok, confirmPassword: 'different' }, 'The new passwords do not match.']
	];
	for (const [form, message] of cases) {
		const r = await run(() => actions.password(event({ user: seeker, form })));
		assert.equal(r.kind === 'fail' && r.data.message, message);
	}

	fake.auth.api.changePassword = spy(async () => {
		throw new APIError('BAD_REQUEST', { code: 'INVALID_PASSWORD', message: 'Invalid password' });
	});
	const wrong = await run(() => actions.password(event({ user: seeker, form: ok })));
	assert.equal(wrong.kind === 'fail' && wrong.data.message, 'Your current password is incorrect.');
});

test('delete account: needs DELETE and the password, then removes the photo and resume files', async () => {
	const deleteUser = (fake.auth.api.deleteUser = spy<[{ body: unknown }], Promise<unknown>>(async () => ({})));
	fake.db.results.push([{ id: 'r1', fileName: 'cv.pdf', storagePath: 'seeker-1/r1.pdf' }]);
	const me = { ...seeker, image: 'https://storage.test/avatars/seeker-1/avatar' };
	const r = await run(() => actions.deleteAccount(event({ user: me, form: { confirm: 'DELETE', password: 'my-password' } })));
	assert.deepEqual(r, { kind: 'redirect', status: 303, location: '/login' });
	assert.deepEqual(deleteUser.calls[0][0].body, { password: 'my-password' });
	assert.deepEqual(fake.storage.deleteAvatar.calls, [['seeker-1']]);
	assert.deepEqual(fake.storage.deleteResume.calls, [['seeker-1/r1.pdf']]);
});

test("delete account: nothing is deleted without DELETE, the password, or when it's wrong", async () => {
	fake.auth.api.deleteUser = spy(async () => {
		throw new APIError('BAD_REQUEST', { code: 'INVALID_PASSWORD', message: 'Invalid password' });
	});
	const cases: [Record<string, string>, string][] = [
		[{ confirm: 'delete', password: 'x' }, 'Type DELETE to confirm.'],
		[{ confirm: 'DELETE', password: '' }, 'Enter your password to confirm.'],
		[{ confirm: 'DELETE', password: 'wrong' }, 'Your password is incorrect.']
	];
	for (const [form, message] of cases) {
		const r = await run(() => actions.deleteAccount(event({ user: seeker, form })));
		assert.equal(r.kind === 'fail' && r.data.message, message);
	}
	assert.equal(fake.storage.deleteResume.calls.length + fake.storage.deleteAvatar.calls.length, 0);
});

// US-16: the welcome questions on the home page
test('onboarding: saves only the answers asked for the role and marks the user onboarded', async () => {
	const form = { company: 'Acme', companyDomain: 'ACME.com', jobTitle: 'Recruiter', headline: 'ignored for recruiters' };
	assert.deepEqual(await run(() => home.actions.onboard(event({ user: recruiter, form }))), { kind: 'ok', data: undefined });
	const [profileUpsert, userUpdate] = fake.db.queries;
	assert.deepEqual(profileUpsert.values, { userId: 'recruiter-1', company: 'Acme', jobTitle: 'Recruiter', companyDomain: 'acme.com' });
	assert.ok(userUpdate.set!.onboardedAt instanceof Date);
	assert.deepEqual(userUpdate.params, ['recruiter-1']);
});

test('onboarding: empty or too-long answers are refused; a bad company domain is dropped; skipping works', async () => {
	const empty = await run(() => home.actions.onboard(event({ user: seeker, form: { headline: 'Student', location: '' } })));
	assert.equal(empty.kind === 'fail' && empty.data.message, 'Fill in location, or skip for now.');
	const long = await run(() => home.actions.onboard(event({ user: seeker, form: { headline: 'x'.repeat(101), location: 'Montréal' } })));
	assert.equal(long.kind === 'fail' && long.data.message, 'Headline must be 100 characters or fewer.');
	assert.equal(fake.db.queries.length, 0);

	await run(() => home.actions.onboard(event({ user: recruiter, form: { company: 'Acme', jobTitle: 'HR', companyDomain: 'not a domain' } })));
	assert.equal((fake.db.queries[0].values as Record<string, unknown>).companyDomain, undefined);

	fake.db.reset();
	await home.actions.skipOnboarding(event({ user: seeker }));
	assert.ok(fake.db.queries[0].set!.onboardedAt instanceof Date);
	assert.deepEqual(fake.db.queries[0].params, ['seeker-1']);
});
