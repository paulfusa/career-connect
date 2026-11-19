import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { PgDialect } from 'drizzle-orm/pg-core';
import { getTableName, type SQL, type Table } from 'drizzle-orm';
import { isHttpError } from '@sveltejs/kit';

// US-09: the review form, the average, and the real company page with a fake db (same setup as follow.test.ts)
registerHooks({
	resolve(specifier, context, next) {
		if (specifier === '$lib/server/db' || specifier === './db') return { url: 'fake:review-db', shortCircuit: true };
		if (specifier === './db/schema') {
			return { url: new URL('../src/lib/server/db/schema.ts', import.meta.url).href, shortCircuit: true };
		}
		if (specifier === './auth.schema') {
			return { url: new URL('../src/lib/server/db/auth.schema.ts', import.meta.url).href, shortCircuit: true };
		}
		if (specifier.startsWith('$lib/')) {
			return { url: new URL(`../src/lib/${specifier.slice(5)}.ts`, import.meta.url).href, shortCircuit: true };
		}
		return next(specifier, context);
	},
	load(url, context, next) {
		if (url === 'fake:review-db') {
			return { format: 'module', source: 'export const db = globalThis.__reviewDb;', shortCircuit: true };
		}
		return next(url, context);
	}
});

const dialect = new PgDialect();
type Select = { table: string; fields: Record<string, unknown>; where?: SQL };
let selects: Select[] = [];
// what each select returns, in order
let results: unknown[][] = [];
let inserts: { table: string; values: Record<string, unknown>; conflictTarget?: unknown }[] = [];
let updates: { table: string; set: Record<string, unknown>; where?: SQL }[] = [];
let deletes: { table: string; where: SQL }[] = [];
let inserted: unknown[] = [];
let updated: unknown[] = [];
let deleted: unknown[] = [];

const db = {
	select(fields: Record<string, unknown> = {}) {
		const call: Select = { table: '', fields };
		selects.push(call);
		const query = {
			from(table: Table) { call.table = getTableName(table); return query; },
			innerJoin() { return query; },
			leftJoin() { return query; },
			where(condition: SQL) { call.where = condition; return query; },
			orderBy() { return query; },
			groupBy() { return query; },
			limit() { return query; },
			then(resolve: (value: unknown[]) => unknown, reject: (reason: unknown) => unknown) {
				return Promise.resolve(results.shift() ?? []).then(resolve, reject);
			}
		};
		return query;
	},
	insert(table: Table) {
		const record: (typeof inserts)[number] = { table: getTableName(table), values: {} };
		const query = {
			values(values: Record<string, unknown>) { record.values = values; inserts.push(record); return query; },
			onConflictDoNothing(options: { target: unknown }) { record.conflictTarget = options.target; return query; },
			returning() { return Promise.resolve(inserted); }
		};
		return query;
	},
	update(table: Table) {
		const record: (typeof updates)[number] = { table: getTableName(table), set: {} };
		const query = {
			set(values: Record<string, unknown>) { record.set = values; return query; },
			where(condition: SQL) { record.where = condition; updates.push(record); return query; },
			returning() { return Promise.resolve(updated); }
		};
		return query;
	},
	delete(table: Table) {
		return {
			where(condition: SQL) {
				deletes.push({ table: getTableName(table), where: condition });
				return { returning: () => Promise.resolve(deleted) };
			}
		};
	}
};
(globalThis as typeof globalThis & { __reviewDb: typeof db }).__reviewDb = db;

const { parseReview, ratingSummary, toRating, canReviewCompany, canSeeReviews, reviewProblem, isSlug } = await import('../src/lib/server/company-reviews.ts');
const { starFills, companySlug } = await import('../src/lib/company-reviews.ts');
const companyPage = await import('../src/routes/(app)/companies/[slug]/+page.server.ts');
const jobsPage = await import('../src/routes/(app)/jobs/+page.server.ts');
const myReviewsPage = await import('../src/routes/(app)/reviews/+page.server.ts');
const companyProfilePage = await import('../src/routes/(app)/company/+page.server.ts');
const companyReviewsPage = await import('../src/routes/(app)/company/reviews/+page.server.ts');
const jobPage = await import('../src/routes/(app)/jobs/[id]/+page.server.ts');

const SLUG = 'northwind';
const profile = { name: 'Northwind', description: 'We make apps.', location: 'Montreal', website: null };
const seeker = { id: 'seeker-1', role: 'job_seeker' };
const owner = { id: 'recruiter-1', role: 'recruiter' };
const otherRecruiter = { id: 'recruiter-2', role: 'recruiter' };
const good = { rating: '4', body: 'Quick replies and a clear interview process.' };
// after finding the company, the page looks up your companies (profile, then your jobs)
const notYours = [[], []];

const formOf = (values: Record<string, string>) => {
	const form = new FormData();
	for (const [key, value] of Object.entries(values)) form.set(key, value);
	return form;
};
// query params, to check which company and user a query is for
const params = (condition?: SQL) => (condition ? dialect.sqlToQuery(condition).params : []);
const sqlOf = (field: unknown) => dialect.sqlToQuery(field as SQL);
// slugOf(job_posting.company) in SQL
const jobCompanySlug = `trim(both '-' from regexp_replace(lower("job_posting"."company"), '[^a-z0-9]+', '-', 'g'))`;

type Result = Record<string, unknown> & { status?: number; data?: Record<string, unknown> };
async function runAction(name: string, me: object, values: Record<string, string> = {}, slug = SLUG) {
	const request = new Request('http://localhost/', { method: 'POST', body: formOf(values) });
	return companyPage.actions[name]({ locals: { user: me }, params: { slug }, request } as never) as Promise<Result>;
}
async function runMyReviewsAction(name: string, me: object, values: Record<string, string>) {
	const request = new Request('http://localhost/', { method: 'POST', body: formOf(values) });
	return myReviewsPage.actions[name]({ locals: { user: me }, request } as never) as Promise<Result>;
}
const openPage = (me: object, slug = SLUG) =>
	companyPage.load({ locals: { user: me }, params: { slug } } as never) as Promise<Record<string, unknown>>;

beforeEach(() => {
	selects = [];
	results = [];
	inserts = [];
	updates = [];
	deletes = [];
	inserted = [{ id: 'review-1' }];
	updated = [{ id: 'review-1' }];
	deleted = [{ id: 'review-1' }];
});

test('form: a rating and a review pass, with the spaces around the review removed', () => {
	const { values, errors } = parseReview(formOf({ rating: '5', body: `  ${good.body}  ` }));
	assert.deepEqual(errors, {});
	assert.deepEqual(values, { rating: 5, body: good.body });
});

test('form: the rating goes from 0 to 5, in half stars', () => {
	for (const [rating, expected] of [['0', 0], ['0.0', 0], ['0.5', 0.5], ['1', 1], ['3.5', 3.5], ['4.5', 4.5], ['5', 5], ['4.0', 4]] as const) {
		assert.equal(parseReview(formOf({ ...good, rating })).values.rating, expected, rating);
		assert.equal(parseReview(formOf({ ...good, rating })).errors.rating, undefined, rating);
	}
	for (const rating of ['5.5', '6', '4.3', '4.25', '-1', '-0', 'five', '', ' 3', '1e0']) {
		assert.equal(parseReview(formOf({ ...good, rating })).errors.rating, 'Pick a star rating.', rating);
	}
	assert.equal(parseReview(formOf({ body: good.body })).errors.rating, 'Pick a star rating.');
});

test('form: the review is required and has a min and max length', () => {
	assert.equal(parseReview(formOf({ ...good, body: '   ' })).errors.body, 'Write a few words about the company.');
	assert.equal(parseReview(formOf({ ...good, body: 'Too short' })).errors.body, 'Your review needs at least 10 characters.');
	assert.equal(parseReview(formOf({ ...good, body: 'x'.repeat(2001) })).errors.body, 'Your review can be at most 2000 characters.');
	// exactly the limits are fine
	assert.deepEqual(parseReview(formOf({ ...good, body: 'x'.repeat(10) })).errors, {});
	assert.deepEqual(parseReview(formOf({ ...good, body: 'x'.repeat(2000) })).errors, {});
});

test('average: none yet, one review, and rounding to one decimal', () => {
	assert.deepEqual(ratingSummary([]), { average: null, count: 0 });
	assert.deepEqual(ratingSummary([4]), { average: 4, count: 1 });
	assert.deepEqual(ratingSummary([4, 2]), { average: 3, count: 2 });
	assert.deepEqual(ratingSummary([5, 2]), { average: 3.5, count: 2 });
	assert.deepEqual(ratingSummary([5, 4, 4]), { average: 4.3, count: 3 });
});

test('stars: averages show half stars, rounded to the closest half', () => {
	assert.deepEqual(starFills(3.5), [1, 1, 1, 0.5, 0]);
	assert.deepEqual(starFills(4), [1, 1, 1, 1, 0]);
	assert.deepEqual(starFills(4.3), [1, 1, 1, 1, 0.5]);
	assert.deepEqual(starFills(4.2), [1, 1, 1, 1, 0]);
	assert.deepEqual(starFills(1.5), [1, 0.5, 0, 0, 0]);
	assert.deepEqual(starFills(5), [1, 1, 1, 1, 1]);
	assert.deepEqual(starFills(0), [0, 0, 0, 0, 0]);
});

test('stars on job postings: the average from postgres is rounded, and no reviews means no stars', () => {
	assert.deepEqual(toRating('4.3333333333333333', 3), { average: 4.3, count: 3 });
	assert.deepEqual(toRating('5.0000000000000000', 1), { average: 5, count: 1 });
	assert.equal(toRating(null, 0), null);
	assert.equal(toRating(undefined, undefined), null);
});

test('company names: Intel, intel and INTEL are the same company', () => {
	assert.equal(companySlug('Intel'), 'intel');
	assert.equal(companySlug('  INTEL '), 'intel');
	assert.equal(companySlug('Lionfish Cyber Security'), 'lionfish-cyber-security');
	assert.equal(companySlug('AT&T'), 'at-t');
	assert.equal(companySlug('Apple News+'), 'apple-news');
	assert.equal(companySlug('!!!'), '');

	// only names like that work in the url
	assert.equal(isSlug('lionfish-cyber-security'), true);
	for (const bad of ['', 'Intel', '-intel', 'intel-', 'in--tel', '../intel', 'a'.repeat(201), null]) assert.equal(isSlug(bad), false, String(bad));
});

test("job list: each job shows its own company's stars, not the recruiter's profile", async () => {
	const job = { archived: false, published: true, status: 'open', applicationDeadline: null };
	results = [[
		{ ...job, id: 'job-1', company: 'Intel', ratingAverage: '3.5000000000000000', ratingCount: 2, yourCompany: false },
		{ ...job, id: 'job-2', company: 'Lionfish Cyber Security', ratingAverage: null, ratingCount: 0, yourCompany: false }
	]];
	const page = (await jobsPage.load({ url: new URL('http://localhost/jobs'), locals: { user: seeker } } as never)) as {
		postings: Record<string, unknown>[];
	};
	assert.deepEqual(page.postings.map((posting) => posting.rating), [{ average: 3.5, count: 2 }, null]);
	// the raw columns aren't sent to the page
	assert.ok(!('ratingAverage' in page.postings[0]) && !('yourCompany' in page.postings[0]));
	// matched by the company name on the job
	const count = sqlOf(selects[0].fields.ratingCount).sql;
	assert.ok(count.includes(`"company_review"."company_slug" = ${jobCompanySlug}`), count);
	assert.ok(!count.includes('company_profile'));

	// a recruiter only gets the stars of their own companies
	results = [[
		{ ...job, id: 'job-1', company: 'Intel', ratingAverage: '3.5', ratingCount: 2, yourCompany: true },
		{ ...job, id: 'job-3', company: 'Meta', ratingAverage: '4', ratingCount: 1, yourCompany: false }
	]];
	const recruiterView = (await jobsPage.load({ url: new URL('http://localhost/jobs'), locals: { user: owner } } as never)) as {
		postings: Record<string, unknown>[];
	};
	assert.deepEqual(recruiterView.postings.map((posting) => posting.rating), [{ average: 3.5, count: 2 }, null]);
	// their companies come from their profile and their jobs
	assert.deepEqual(sqlOf(selects[1].fields.yourCompany).params, ['recruiter-1', 'recruiter-1']);
});

test('my reviews: only the reviews you wrote', async () => {
	results = [[{ id: 'r1', rating: 4, companySlug: SLUG, companyName: 'Northwind' }]];
	const page = (await myReviewsPage.load({ locals: { user: seeker } } as never)) as Record<string, unknown>;

	assert.equal((page.reviews as unknown[]).length, 1);
	assert.equal(selects[0].table, 'company_review');
	assert.deepEqual(params(selects[0].where), ['seeker-1']);
});

test("my reviews: recruiters don't write reviews, so they can't open it or edit from it", async () => {
	await assert.rejects(async () => myReviewsPage.load({ locals: { user: owner } } as never), (err) => isHttpError(err, 403));
	assert.equal(selects.length, 0);

	const edit = await runMyReviewsAction('edit', otherRecruiter, { ...good, company: SLUG });
	assert.equal(edit.status, 403);
	assert.equal(updates.length, 0);
});

test('my reviews: you can edit and delete your review right from the list', async () => {
	const edited = await runMyReviewsAction('edit', seeker, { company: SLUG, rating: '2', body: good.body });
	assert.equal(edited.updated, true);
	assert.equal(updates[0].set.rating, 2);
	assert.deepEqual(params(updates[0].where), [SLUG, 'seeker-1']);

	const deletedResult = await runMyReviewsAction('delete', seeker, { company: SLUG });
	assert.equal(deletedResult.deleted, true);
	assert.deepEqual(params(deletes[0].where), [SLUG, 'seeker-1']);
});

test('my reviews: a bad company, a wrong form or a review that is gone is refused', async () => {
	assert.equal((await runMyReviewsAction('edit', seeker, { ...good, company: 'Not a company' })).status, 404);
	assert.equal((await runMyReviewsAction('delete', seeker, { company: '../northwind' })).status, 404);

	// the errors come back with the company, so the page knows which review they're for
	const bad = await runMyReviewsAction('edit', seeker, { company: SLUG, rating: '', body: good.body });
	assert.equal(bad.status, 400);
	assert.equal(bad.data?.company, SLUG);
	assert.equal(updates.length, 0);
	assert.equal(deletes.length, 0);

	updated = [];
	deleted = [];
	assert.equal((await runMyReviewsAction('edit', seeker, { ...good, company: SLUG })).data?.message, "That review doesn't exist anymore.");
	assert.equal((await runMyReviewsAction('delete', seeker, { company: SLUG })).status, 404);
});

test('who can review: only job seekers, recruiters can just read', () => {
	assert.equal(reviewProblem(seeker, false), null);
	assert.equal(canReviewCompany(seeker, false), true);
	assert.equal(reviewProblem(otherRecruiter, false), 'Only job seekers can review companies.');
	assert.equal(reviewProblem(owner, true), 'Only job seekers can review companies.');
	assert.equal(canReviewCompany(null, false), false);
	// an admin who has this company and switched to the job seeker view
	assert.equal(reviewProblem({ role: 'job_seeker' }, true), "You can't review your own company.");
});

test('who can see reviews: job seekers see all of them, recruiters only their own companies', () => {
	assert.equal(canSeeReviews(seeker, false), true);
	assert.equal(canSeeReviews(owner, true), true);
	assert.equal(canSeeReviews(otherRecruiter, false), false);
	assert.equal(canSeeReviews(null, false), false);
});

test('page: a company nobody has heard of, or a bad address, is a 404', async () => {
	await assert.rejects(openPage(seeker, 'Not A Slug'), (err) => isHttpError(err, 404));
	assert.equal(selects.length, 0);

	// no profile, no job and no review with that name
	results = [[], [], []];
	await assert.rejects(openPage(seeker), (err) => isHttpError(err, 404));
	assert.equal(selects.length, 3);
});

test('page: shows the reviews of this company, which one is yours, and the average', async () => {
	const date = new Date('2026-11-18T12:00:00Z');
	results = [
		[profile],
		...notYours,
		[
			{ id: 'r1', userId: 'seeker-1', rating: 4, body: good.body, createdAt: date, updatedAt: date, authorName: 'Find jobs', authorImage: null },
			{ id: 'r2', userId: 'seeker-2', rating: 2, body: 'Never heard back after applying.', createdAt: date, updatedAt: date, authorName: 'Sam', authorImage: null }
		]
	];
	const page = await openPage(seeker);

	// the profile and the reviews are both found by the name
	assert.deepEqual(params(selects[0].where), [SLUG]);
	assert.equal(selects[3].table, 'company_review');
	assert.deepEqual(params(selects[3].where), [SLUG]);
	assert.deepEqual(page.company, { slug: SLUG, name: 'Northwind', profile });
	const reviews = page.reviews as Record<string, unknown>[];
	assert.deepEqual(reviews.map((review) => review.mine), [true, false]);
	// the page doesn't get other people's user ids
	assert.ok(reviews.every((review) => !('userId' in review)));
	assert.deepEqual(page.summary, { average: 3, count: 2 });
	assert.equal(page.canReview, true);
	assert.equal(page.isOwner, false);
});

test("page: a company that's only on job postings, or only in old reviews, still has a page", async () => {
	results = [[], [{ name: 'Lionfish Cyber Security' }], ...notYours, []];
	const fromJob = await openPage(seeker, 'lionfish-cyber-security');
	assert.deepEqual(fromJob.company, { slug: 'lionfish-cyber-security', name: 'Lionfish Cyber Security', profile: null });
	assert.equal(fromJob.canReview, true);

	results = [[], [], [{ name: 'Gone Inc' }], ...notYours, []];
	assert.equal(((await openPage(seeker, 'gone-inc')).company as { name: string }).name, 'Gone Inc');
});

test("page: a recruiter can read their own companies' reviews but can't review them", async () => {
	// the company on their profile
	results = [[profile], [{ slug: SLUG, name: 'Northwind' }], [], []];
	const page = await openPage(owner);
	assert.equal(page.isOwner, true);
	assert.equal(page.canReview, false);
	assert.deepEqual(page.summary, { average: null, count: 0 });
	assert.deepEqual(params(selects[1].where), ['recruiter-1']);

	// or a company they posted a job for
	results = [[profile], [], [{ slug: SLUG, name: 'NORTHWIND' }], []];
	assert.equal((await openPage(otherRecruiter)).isOwner, true);
});

test("page: other recruiters can't open the page at all", async () => {
	results = [[profile], ...notYours];
	await assert.rejects(openPage(otherRecruiter), (err) => isHttpError(err, 403));
	// stopped before the reviews were loaded
	assert.equal(selects.length, 3);
});

// a Northwind job whose company has 2 reviews (4.5 on average)
async function openJob(me: { role: string }, changes: Record<string, unknown> = {}) {
	const posting = { id: '11111111-1111-4111-8111-111111111111', company: 'Northwind', createdBy: 'recruiter-1', published: true, archived: false, status: 'open', applicationDeadline: null };
	results = [
		[{ posting, creatorName: 'Hiring company', creatorImage: null, companyProfile: profile, companySlug: SLUG, ratingAverage: '4.5', ratingCount: 2, yourCompany: false, ...changes }],
		// for job seekers the page also gets their application and resumes
		...(me.role === 'job_seeker' ? [[], []] : []),
		[{ total: 0 }],
		[]
	];
	return (await jobPage.load({ params: { id: posting.id }, locals: { user: me } } as never)) as Record<string, unknown>;
}

test("job page: shows the stars of the job's company, recruiters only for their own companies", async () => {
	const seekerView = await openJob(seeker);
	assert.equal(seekerView.showReviews, true);
	assert.deepEqual(seekerView.companyRating, { average: 4.5, count: 2 });
	assert.equal(seekerView.aboutThisCompany, true);
	const count = sqlOf(selects[0].fields.ratingCount).sql;
	assert.ok(count.includes(`"company_review"."company_slug" = ${jobCompanySlug}`), count);

	const ownerView = await openJob(owner, { yourCompany: true });
	assert.equal(ownerView.showReviews, true);
	assert.deepEqual(ownerView.companyRating, { average: 4.5, count: 2 });

	const otherView = await openJob(otherRecruiter);
	assert.equal(otherView.showReviews, false);
	assert.equal(otherView.companyRating, null);
	assert.equal(otherView.aboutThisCompany, false);
	// the raw numbers don't get sent either
	assert.ok(!('ratingAverage' in otherView) && !('yourCompany' in otherView));
});

test("job page: a job at another company doesn't link the recruiter's profile to the reviews", async () => {
	// Hiring company's profile is Intel, but this job is at Lionfish
	const page = await openJob(seeker, { companyProfile: { ...profile, name: 'Intel' }, companySlug: 'lionfish-cyber-security', ratingAverage: null, ratingCount: 0 });
	assert.equal(page.showReviews, true);
	assert.equal(page.companySlug, 'lionfish-cyber-security');
	assert.equal(page.companyRating, null);
	assert.equal(page.aboutThisCompany, false);
});

test('company reviews: a recruiter sees each of their companies with its stars', async () => {
	results = [
		[{ slug: SLUG, name: 'Northwind' }],
		[{ slug: SLUG, name: 'NORTHWIND' }, { slug: 'lionfish-cyber-security', name: 'Lionfish Cyber Security' }, { slug: '', name: '!!!' }],
		[{ slug: SLUG, average: '4.0000000000000000', count: 1 }]
	];
	const page = (await companyReviewsPage.load({ locals: { user: owner } } as never)) as Record<string, unknown>;
	// uses the profile's spelling, and skips '!!!'
	assert.deepEqual(page.companies, [
		{ slug: SLUG, name: 'Northwind', rating: { average: 4, count: 1 } },
		{ slug: 'lionfish-cyber-security', name: 'Lionfish Cyber Security', rating: null }
	]);
	assert.deepEqual(params(selects[0].where), ['recruiter-1']);
	assert.deepEqual(params(selects[1].where), ['recruiter-1']);
	assert.deepEqual(params(selects[2].where), [SLUG, 'lionfish-cyber-security']);

	// no profile and no jobs yet, so the page asks them to make a profile
	selects = [];
	results = [[], []];
	assert.deepEqual(await companyReviewsPage.load({ locals: { user: otherRecruiter } } as never), { companies: [] });
	assert.equal(selects.length, 2);

	await assert.rejects(async () => companyReviewsPage.load({ locals: { user: seeker } } as never), (err) => isHttpError(err, 403));
});

test('company profile: shows the stars of your company', async () => {
	results = [[profile], [{ slug: SLUG, average: '4.2500000000000000', count: 2 }]];
	const page = (await companyProfilePage.load({ locals: { user: owner } } as never)) as Record<string, unknown>;
	assert.deepEqual(page.rating, { average: 4.3, count: 2 });
	assert.equal(page.companySlug, SLUG);
	assert.deepEqual(params(selects[1].where), [SLUG]);

	// no reviews yet, or no company yet
	results = [[profile], []];
	assert.equal(((await companyProfilePage.load({ locals: { user: owner } } as never)) as Record<string, unknown>).rating, null);
	results = [[]];
	assert.equal(((await companyProfilePage.load({ locals: { user: otherRecruiter } } as never)) as Record<string, unknown>).rating, null);
});

test('post: a review is saved for this company and the signed-in user', async () => {
	results = [[profile], ...notYours];
	// a userId or company sent in the form is ignored
	const result = await runAction('post', seeker, { ...good, userId: 'someone-else', company: 'other' });
	assert.equal(result.posted, true);
	assert.equal(inserts.length, 1);
	assert.equal(inserts[0].table, 'company_review');
	assert.deepEqual(inserts[0].values, { companySlug: SLUG, companyName: 'Northwind', userId: 'seeker-1', rating: 4, body: good.body });
	assert.ok(Array.isArray(inserts[0].conflictTarget));
});

test('post: a second review of the same company is refused', async () => {
	results = [[profile], ...notYours];
	inserted = [];
	const result = await runAction('post', seeker, good);
	assert.equal(result.status, 400);
	assert.equal(result.data?.message, 'You already reviewed this company. You can edit your review instead.');
});

test('post: a wrong form comes back with the messages and nothing is saved', async () => {
	results = [[profile], ...notYours];
	const result = await runAction('post', seeker, { rating: '', body: 'Nice' });
	assert.equal(result.status, 400);
	const errors = result.data?.errors as Record<string, string>;
	assert.equal(errors.rating, 'Pick a star rating.');
	assert.equal(errors.body, 'Your review needs at least 10 characters.');
	assert.equal((result.data?.values as Record<string, unknown>).body, 'Nice');
	assert.equal(inserts.length, 0);
});

test("post: recruiters can't post a review, and neither can an admin about their own company", async () => {
	for (const recruiter of [owner, otherRecruiter]) {
		results = [[profile], ...notYours];
		const result = await runAction('post', recruiter, good);
		assert.equal(result.status, 403);
		assert.equal(result.data?.message, 'Only job seekers can review companies.');
	}

	results = [[profile], [{ slug: SLUG, name: 'Northwind' }], []];
	const admin = await runAction('post', { id: 'admin-1', role: 'job_seeker' }, good);
	assert.equal(admin.status, 403);
	assert.equal(admin.data?.message, "You can't review your own company.");
	assert.equal(inserts.length, 0);
});

test('post: a company that does not exist is refused', async () => {
	assert.equal((await runAction('post', seeker, good, 'Not A Slug')).status, 404);
	results = [[], [], []];
	assert.equal((await runAction('post', seeker, good)).status, 404);
	assert.equal(inserts.length, 0);
});

test('edit: you can only change your own review', async () => {
	const result = await runAction('edit', seeker, { rating: '5', body: good.body });
	assert.equal(result.updated, true);
	assert.equal(updates[0].table, 'company_review');
	assert.equal(updates[0].set.rating, 5);
	assert.ok(updates[0].set.updatedAt instanceof Date);
	// only matches your review of this company
	assert.deepEqual(params(updates[0].where), [SLUG, 'seeker-1']);

	// recruiters can't edit
	assert.equal((await runAction('edit', otherRecruiter, good)).status, 403);
	assert.equal(updates.length, 1);
});

test('edit: a wrong form goes back to the edit form, and a missing review is a 404', async () => {
	const bad = await runAction('edit', seeker, { rating: '9', body: good.body });
	assert.equal(bad.status, 400);
	assert.equal(bad.data?.editing, true);
	assert.equal(updates.length, 0);

	updated = [];
	const missing = await runAction('edit', seeker, good);
	assert.equal(missing.status, 404);
	assert.equal(missing.data?.message, "You haven't reviewed this company.");

	assert.equal((await runAction('edit', seeker, good, 'Not A Slug')).status, 404);
});

test('delete: you can delete your own review', async () => {
	const result = await runAction('delete', seeker);
	assert.equal(result.deleted, true);
	assert.equal(deletes[0].table, 'company_review');
	assert.deepEqual(params(deletes[0].where), [SLUG, 'seeker-1']);
});

test('delete: nothing to delete, or a bad address, is refused', async () => {
	deleted = [];
	const result = await runAction('delete', seeker);
	assert.equal(result.status, 404);
	assert.equal(result.data?.message, "You haven't reviewed this company.");

	assert.equal((await runAction('delete', seeker, {}, 'Not A Slug')).status, 404);
	assert.equal(deletes.length, 1);
});
