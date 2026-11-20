import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { useFakes, resetFakes, fake, event, run, seeker, recruiter } from './helpers/fakes.ts';

// US-07, US-12, US-13, US-15: the company profile pages, the job posting create and edit pages,
// and withdrawing an application.
// The validation itself is tested in src/lib/server; this checks the pages use it and stay owner-only.
useFakes();
const company = await import('../src/routes/(app)/company/+page.server.ts');
const companyEdit = await import('../src/routes/(app)/company/edit/+page.server.ts');
const newJob = await import('../src/routes/(app)/jobs/new/+page.server.ts');
const editJob = await import('../src/routes/(app)/jobs/[id]/edit/+page.server.ts');
const jobPage = await import('../src/routes/(app)/jobs/[id]/+page.server.ts');

beforeEach(resetFakes);

const id = '11111111-1111-4111-8111-111111111111';
const acme = { name: 'Acme', description: 'We build tools.', location: 'Montréal', website: '' };
const job = {
	title: 'Software Engineer',
	company: 'Acme',
	location: 'Montreal, QC',
	employmentType: 'full_time',
	workMode: 'hybrid',
	description: 'Build useful software.',
	requirements: 'Java experience',
	applicationDeadline: '2099-10-23'
};
// US-34: the recruiter's company, as yourCompanies() returns it
const acmeCompany = { slug: 'acme', name: 'Acme', website: null };

test('company pages: only recruiters, each seeing their own companies', async () => {
	for (const page of [company, companyEdit]) {
		const denied = await run(() => page.load(event({ user: seeker })));
		assert.deepEqual(denied, { kind: 'error', status: 403, message: 'Only recruiters can manage company profiles.' });
	}

	// US-34: a recruiter can have several companies
	fake.db.results.push([{ name: 'Acme' }]);
	assert.deepEqual(await company.load(event({ user: recruiter })), { companies: [{ name: 'Acme', slug: 'acme', rating: null }] });
	assert.deepEqual(fake.db.queries[0].params, ['recruiter-1']);
	assert.deepEqual(await company.load(event({ user: recruiter })), { companies: [] });

	// the edit page opens one of yours with ?id=, and no id means a new one
	const edit = `http://localhost/company/edit?id=${id}`;
	assert.deepEqual(await companyEdit.load(event({ user: recruiter })), { company: null });
	fake.db.results.push([{ name: 'Acme' }]);
	assert.deepEqual(await companyEdit.load(event({ user: recruiter, url: edit })), { company: { name: 'Acme' } });
	assert.deepEqual(fake.db.queries.at(-1)!.params, [id, 'recruiter-1']);
	assert.deepEqual(await run(() => companyEdit.load(event({ user: recruiter, url: edit }))), {
		kind: 'error',
		status: 404,
		message: 'Company not found.'
	});
});

test('company save: adds a new company or updates one of yours', async () => {
	fake.db.results.push([], [{ id: 'company-1' }]);
	const r = await run(() => companyEdit.actions.save(event({ user: recruiter, form: acme })));
	assert.equal(r.kind === 'ok' && (r.data as { message: string }).message, 'Company profile saved successfully.');
	const insert = fake.db.queries[1];
	assert.equal(insert.op, 'insert');
	assert.deepEqual(insert.values, { recruiterId: 'recruiter-1', name: 'Acme', description: 'We build tools.', location: 'Montréal', website: null });

	// US-34: with an id it updates that company instead
	fake.db.reset();
	fake.db.results.push([{ id, name: 'Acme' }]);
	const updated = await run(() => companyEdit.actions.save(event({ user: recruiter, form: { ...acme, id } })));
	assert.equal(updated.kind === 'ok' && (updated.data as { message: string }).message, 'Company profile saved successfully.');
	assert.deepEqual(fake.db.queries.map((q) => q.op), ['select', 'update']);
});

test('company save: job seekers and invalid fields are refused without saving', async () => {
	const denied = await run(() => companyEdit.actions.save(event({ user: seeker, form: acme })));
	assert.equal(denied.kind === 'fail' && denied.status, 403);
	const missing = await run(() => companyEdit.actions.save(event({ user: recruiter, form: { ...acme, name: ' ' } })));
	assert.equal(missing.kind === 'fail' && missing.data.message, 'Please fill in all required fields.');
	const badSite = await run(() => companyEdit.actions.save(event({ user: recruiter, form: { ...acme, website: 'javascript:alert(1)' } })));
	assert.equal(badSite.kind === 'fail' && badSite.data.message, 'Please enter a valid website URL.');
	assert.equal(fake.db.queries.length, 0);
});

test('new job: recruiters create a posting and land on it; others are refused', async () => {
	assert.deepEqual(await run(() => newJob.load(event({ user: seeker }))), { kind: 'error', status: 403, message: 'Only recruiters can create job postings.' });
	// US-34: the company list only has your companies
	fake.db.results.push([acmeCompany]);
	assert.deepEqual(await newJob.load(event({ user: recruiter })), { companies: ['Acme'] });

	fake.db.results.push([acmeCompany], [{ id }]);
	const r = await run(() => newJob.actions.create(event({ user: recruiter, form: job })));
	assert.deepEqual(r, { kind: 'redirect', status: 303, location: `/jobs/${id}` });
	assert.equal((fake.db.queries.at(-1)!.values as { createdBy: string }).createdBy, 'recruiter-1');

	const denied = await run(() => newJob.actions.create(event({ user: seeker, form: job })));
	assert.equal(denied.kind === 'fail' && denied.status, 403);
	fake.db.results.push([acmeCompany]);
	const invalid = await run(() => newJob.actions.create(event({ user: recruiter, form: { ...job, title: '' } })));
	assert.equal(invalid.kind === 'fail' && invalid.status, 400);
	assert.ok(invalid.kind === 'fail' && (invalid.data.errors as Record<string, string>).title);
	assert.equal(fake.db.queries.filter((q) => q.op === 'insert').length, 1);
});

test('edit job: only the recruiter who posted it can open the editor', async () => {
	const notFound = { kind: 'error', status: 404, message: 'Job posting not found.' };
	assert.deepEqual(await run(() => editJob.load(event({ user: seeker, params: { id } }))), notFound);
	assert.deepEqual(await run(() => editJob.load(event({ user: recruiter, params: { id: 'nope' } }))), notFound);
	assert.deepEqual(await run(() => editJob.load(event({ user: recruiter, params: { id } }))), notFound); // not theirs
	assert.deepEqual(fake.db.queries[0].params, [id, 'recruiter-1']);

	fake.db.results.push([{ id, createdBy: 'recruiter-1', title: 'Engineer', requirements: null, applicationDeadline: null }]);
	const data = (await editJob.load(event({ user: recruiter, params: { id } }))) as { posting: Record<string, unknown> };
	assert.equal(data.posting.title, 'Engineer');
	// empty optional fields come back as '' so the form inputs stay controlled
	assert.equal(data.posting.requirements, '');
	assert.equal(data.posting.applicationDeadline, '');
});

test('edit job: saving and deleting are limited to the owner’s posting', async () => {
	// US-34: each save first looks up your companies
	fake.db.results.push([acmeCompany], [{ id }]);
	assert.deepEqual(await run(() => editJob.actions.save(event({ user: recruiter, params: { id }, form: job }))), {
		kind: 'redirect',
		status: 303,
		location: `/jobs/${id}?saved=1`
	});
	assert.deepEqual(fake.db.queries.at(-1)!.params?.slice(-2), [id, 'recruiter-1']);

	fake.db.results.push([acmeCompany], []); // someone else's posting: the scoped update changes nothing
	assert.deepEqual(await run(() => editJob.actions.save(event({ user: recruiter, params: { id }, form: job }))), {
		kind: 'fail',
		status: 404,
		data: { message: 'Job posting not found.' }
	});
	fake.db.results.push([acmeCompany]);
	const invalid = await run(() => editJob.actions.save(event({ user: recruiter, params: { id }, form: { ...job, title: '' } })));
	assert.equal(invalid.kind === 'fail' && invalid.status, 400);
	const denied = await run(() => editJob.actions.save(event({ user: seeker, params: { id }, form: job })));
	assert.equal(denied.kind === 'fail' && denied.status, 403);

	fake.db.reset();
	fake.db.results.push([{ id }]);
	assert.deepEqual(await run(() => editJob.actions.delete(event({ user: recruiter, params: { id } }))), {
		kind: 'redirect',
		status: 303,
		location: '/jobs?mine'
	});
	assert.deepEqual(fake.db.queries[0].params, [id, 'recruiter-1']);
	assert.equal((await run(() => editJob.actions.delete(event({ user: recruiter, params: { id } })))).kind, 'fail');
	const deniedDelete = await run(() => editJob.actions.delete(event({ user: seeker, params: { id } })));
	assert.equal(deniedDelete.kind === 'fail' && deniedDelete.status, 403);
});

const openJob = { published: true, status: 'open', applicationDeadline: '2099-01-01' };

test('withdraw: a job seeker withdraws their own undecided application', async () => {
	fake.db.results.push([openJob], [{ id: 'application-1', outcomeId: null }], [{ id: 'application-1' }]);
	const r = await run(() => jobPage.actions.withdraw(event({ user: seeker, params: { id } })));
	assert.deepEqual(r, { kind: 'ok', data: { success: 'Your application has been withdrawn.' } });
	const removed = fake.db.queries.at(-1)!;
	assert.equal(removed.op, 'delete');
	assert.deepEqual(removed.params, [id, 'seeker-1']);
});

test("withdraw: refused for recruiters, unknown jobs, decided applications, or when there's nothing to withdraw", async () => {
	const fails = async (user: object, rows: unknown[][], jobId = id) => {
		fake.db.reset();
		fake.db.results.push(...rows);
		const r = await run(() => jobPage.actions.withdraw(event({ user, params: { id: jobId } })));
		return r.kind === 'fail' ? [r.status, r.data.error] : r;
	};
	assert.deepEqual(await fails(recruiter, []), [403, 'Only job seekers can withdraw applications.']);
	assert.deepEqual(await fails(seeker, [], 'nope'), [404, 'Job posting not found.']);
	assert.deepEqual(await fails(seeker, [[], []]), [400, 'Job posting not found.']);
	assert.deepEqual(await fails(seeker, [[openJob], [{ id: 'a1', outcomeId: 'o1' }]]), [
		400,
		'You can no longer withdraw because the recruiter has already sent a decision.'
	]);
	// the application disappeared between the check and the delete
	assert.deepEqual(await fails(seeker, [[openJob], [{ id: 'a1', outcomeId: null }], []]), [404, 'You have no application to withdraw.']);
});
