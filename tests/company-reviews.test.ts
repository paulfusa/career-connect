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
type Select = { table: string; where?: SQL };
let selects: Select[] = [];
// what each select returns, in order (company first, then reviews)
let results: unknown[][] = [];
let inserts: { table: string; values: Record<string, unknown>; conflictTarget?: unknown }[] = [];
let updates: { table: string; set: Record<string, unknown>; where?: SQL }[] = [];
let deletes: { table: string; where: SQL }[] = [];
let inserted: unknown[] = [];
let updated: unknown[] = [];
let deleted: unknown[] = [];

const db = {
	select() {
		const call: Select = { table: '' };
		selects.push(call);
		const query = {
			from(table: Table) { call.table = getTableName(table); return query; },
			innerJoin() { return query; },
			where(condition: SQL) { call.where = condition; return query; },
			orderBy() { return query; },
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

const { parseReview, ratingSummary, toRating, canReviewCompany, reviewProblem } = await import('../src/lib/server/company-reviews.ts');
const { starFills } = await import('../src/lib/company-reviews.ts');
const companyPage = await import('../src/routes/(app)/companies/[id]/+page.server.ts');
const jobsPage = await import('../src/routes/(app)/jobs/+page.server.ts');
const myReviewsPage = await import('../src/routes/(app)/reviews/+page.server.ts');

const COMPANY_ID = '7d3e2a10-5b6c-4f8e-9a1b-2c3d4e5f6a7b';
const company = { id: COMPANY_ID, recruiterId: 'recruiter-1', name: 'Northwind', description: 'We make apps.', location: 'Montreal', website: null };
const seeker = { id: 'seeker-1', role: 'job_seeker' };
const owner = { id: 'recruiter-1', role: 'recruiter' };
const otherRecruiter = { id: 'recruiter-2', role: 'recruiter' };
const good = { rating: '4', body: 'Quick replies and a clear interview process.' };

const formOf = (values: Record<string, string>) => {
	const form = new FormData();
	for (const [key, value] of Object.entries(values)) form.set(key, value);
	return form;
};
// query params, to check which company and user a query is for
const params = (condition?: SQL) => (condition ? dialect.sqlToQuery(condition).params : []);

type Result = Record<string, unknown> & { status?: number; data?: Record<string, unknown> };
async function runAction(name: string, me: object, values: Record<string, string> = {}, id = COMPANY_ID) {
	const request = new Request('http://localhost/', { method: 'POST', body: formOf(values) });
	return companyPage.actions[name]({ locals: { user: me }, params: { id }, request } as never) as Promise<Result>;
}
async function runMyReviewsAction(name: string, me: object, values: Record<string, string>) {
	const request = new Request('http://localhost/', { method: 'POST', body: formOf(values) });
	return myReviewsPage.actions[name]({ locals: { user: me }, request } as never) as Promise<Result>;
}
const openPage = (me: object, id = COMPANY_ID) =>
	companyPage.load({ locals: { user: me }, params: { id } } as never) as Promise<Record<string, unknown>>;

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

test('form: the rating goes from half a star to 5, in half stars', () => {
	for (const [rating, expected] of [['0.5', 0.5], ['1', 1], ['3.5', 3.5], ['4.5', 4.5], ['5', 5], ['4.0', 4]] as const) {
		assert.equal(parseReview(formOf({ ...good, rating })).values.rating, expected, rating);
	}
	for (const rating of ['0', '0.0', '5.5', '6', '4.3', '4.25', '-1', 'five', '', ' 3', '1e0']) {
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

test('job list: each posting gets the stars of its company', async () => {
	const job = { archived: false, published: true, status: 'open', applicationDeadline: null };
	results = [[
		{ ...job, id: 'job-1', createdBy: 'recruiter-1', ratingAverage: '3.5000000000000000', ratingCount: 2 },
		{ ...job, id: 'job-2', createdBy: 'recruiter-2', ratingAverage: null, ratingCount: 0 }
	]];
	const page = (await jobsPage.load({ url: new URL('http://localhost/jobs'), locals: { user: seeker } } as never)) as {
		postings: Record<string, unknown>[];
	};
	assert.deepEqual(page.postings.map((posting) => posting.rating), [{ average: 3.5, count: 2 }, null]);
	// the raw columns aren't sent to the page
	assert.ok(!('ratingAverage' in page.postings[0]));
});

test('my reviews: only the reviews you wrote', async () => {
	results = [[{ id: 'r1', rating: 4, companyId: COMPANY_ID, companyName: 'Northwind' }]];
	const page = (await myReviewsPage.load({ locals: { user: seeker } } as never)) as Record<string, unknown>;

	assert.equal((page.reviews as unknown[]).length, 1);
	assert.equal(selects[0].table, 'company_review');
	assert.deepEqual(params(selects[0].where), ['seeker-1']);
});

test("my reviews: recruiters don't write reviews, so they can't open it or edit from it", async () => {
	await assert.rejects(async () => myReviewsPage.load({ locals: { user: owner } } as never), (err) => isHttpError(err, 403));
	assert.equal(selects.length, 0);

	const edit = await runMyReviewsAction('edit', otherRecruiter, { ...good, companyId: COMPANY_ID });
	assert.equal(edit.status, 403);
	assert.equal(updates.length, 0);
});

test('my reviews: you can edit and delete your review right from the list', async () => {
	const edited = await runMyReviewsAction('edit', seeker, { companyId: COMPANY_ID, rating: '2', body: good.body });
	assert.equal(edited.updated, true);
	assert.equal(updates[0].set.rating, 2);
	assert.deepEqual(params(updates[0].where), [COMPANY_ID, 'seeker-1']);

	const deletedResult = await runMyReviewsAction('delete', seeker, { companyId: COMPANY_ID });
	assert.equal(deletedResult.deleted, true);
	assert.deepEqual(params(deletes[0].where), [COMPANY_ID, 'seeker-1']);
});

test('my reviews: a bad company, a wrong form or a review that is gone is refused', async () => {
	assert.equal((await runMyReviewsAction('edit', seeker, { ...good, companyId: 'nope' })).status, 404);
	assert.equal((await runMyReviewsAction('delete', seeker, { companyId: 'nope' })).status, 404);

	// the errors come back with the company, so the page knows which review they're for
	const bad = await runMyReviewsAction('edit', seeker, { companyId: COMPANY_ID, rating: '', body: good.body });
	assert.equal(bad.status, 400);
	assert.equal(bad.data?.companyId, COMPANY_ID);
	assert.equal(updates.length, 0);
	assert.equal(deletes.length, 0);

	updated = [];
	deleted = [];
	assert.equal((await runMyReviewsAction('edit', seeker, { ...good, companyId: COMPANY_ID })).data?.message, "That review doesn't exist anymore.");
	assert.equal((await runMyReviewsAction('delete', seeker, { companyId: COMPANY_ID })).status, 404);
});

test('who can review: only job seekers, recruiters can just read', () => {
	assert.equal(reviewProblem(seeker, company), null);
	assert.equal(canReviewCompany(seeker, company), true);
	assert.equal(reviewProblem(otherRecruiter, company), 'Only job seekers can review companies.');
	assert.equal(reviewProblem(owner, company), 'Only job seekers can review companies.');
	assert.equal(canReviewCompany(null, company), false);
	// an admin who owns the company and switched to the job seeker view
	assert.equal(reviewProblem({ id: 'recruiter-1', role: 'job_seeker' }, company), "You can't review your own company.");
});

test('page: a company that does not exist, or a bad id, is a 404', async () => {
	await assert.rejects(openPage(seeker, 'not-an-id'), (err) => isHttpError(err, 404));
	assert.equal(selects.length, 0);

	results = [[]];
	await assert.rejects(openPage(seeker), (err) => isHttpError(err, 404));
});

test('page: shows the reviews of this company, which one is yours, and the average', async () => {
	const date = new Date('2026-11-18T12:00:00Z');
	results = [
		[company],
		[
			{ id: 'r1', userId: 'seeker-1', rating: 4, body: good.body, createdAt: date, updatedAt: date, authorName: 'Find jobs', authorImage: null },
			{ id: 'r2', userId: 'seeker-2', rating: 2, body: 'Never heard back after applying.', createdAt: date, updatedAt: date, authorName: 'Sam', authorImage: null }
		]
	];
	const page = await openPage(seeker);

	assert.equal(selects[1].table, 'company_review');
	assert.deepEqual(params(selects[1].where), [COMPANY_ID]);
	const reviews = page.reviews as Record<string, unknown>[];
	assert.deepEqual(reviews.map((review) => review.mine), [true, false]);
	// the page doesn't get other people's user ids
	assert.ok(reviews.every((review) => !('userId' in review)));
	assert.deepEqual(page.summary, { average: 3, count: 2 });
	assert.equal(page.canReview, true);
	assert.equal(page.isOwner, false);
});

test("page: recruiters can see it but can't review, their own company or any other", async () => {
	results = [[company], []];
	const page = await openPage(owner);
	assert.equal(page.isOwner, true);
	assert.equal(page.canReview, false);
	assert.deepEqual(page.summary, { average: null, count: 0 });

	results = [[company], []];
	const other = await openPage(otherRecruiter);
	assert.equal(other.isOwner, false);
	assert.equal(other.canReview, false);
});

test('post: a review is saved for this company and the signed-in user', async () => {
	results = [[company]];
	// a userId or companyId sent in the form is ignored
	const result = await runAction('post', seeker, { ...good, userId: 'someone-else', companyId: 'other' });
	assert.equal(result.posted, true);
	assert.equal(inserts.length, 1);
	assert.equal(inserts[0].table, 'company_review');
	assert.deepEqual(inserts[0].values, { companyId: COMPANY_ID, userId: 'seeker-1', rating: 4, body: good.body });
	assert.ok(Array.isArray(inserts[0].conflictTarget));
});

test('post: a second review of the same company is refused', async () => {
	results = [[company]];
	inserted = [];
	const result = await runAction('post', seeker, good);
	assert.equal(result.status, 400);
	assert.equal(result.data?.message, 'You already reviewed this company. You can edit your review instead.');
});

test('post: a wrong form comes back with the messages and nothing is saved', async () => {
	results = [[company]];
	const result = await runAction('post', seeker, { rating: '', body: 'Nice' });
	assert.equal(result.status, 400);
	const errors = result.data?.errors as Record<string, string>;
	assert.equal(errors.rating, 'Pick a star rating.');
	assert.equal(errors.body, 'Your review needs at least 10 characters.');
	assert.equal((result.data?.values as Record<string, unknown>).body, 'Nice');
	assert.equal(inserts.length, 0);
});

test("post: recruiters can't post a review, even about another company", async () => {
	for (const recruiter of [owner, otherRecruiter]) {
		results = [[company]];
		const result = await runAction('post', recruiter, good);
		assert.equal(result.status, 403);
		assert.equal(result.data?.message, 'Only job seekers can review companies.');
	}
	assert.equal(inserts.length, 0);
});

test('post: a company that does not exist is refused', async () => {
	assert.equal((await runAction('post', seeker, good, 'not-an-id')).status, 404);
	results = [[]];
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
	assert.deepEqual(params(updates[0].where), [COMPANY_ID, 'seeker-1']);

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

	assert.equal((await runAction('edit', seeker, good, 'not-an-id')).status, 404);
});

test('delete: you can delete your own review', async () => {
	const result = await runAction('delete', seeker);
	assert.equal(result.deleted, true);
	assert.equal(deletes[0].table, 'company_review');
	assert.deepEqual(params(deletes[0].where), [COMPANY_ID, 'seeker-1']);
});

test('delete: nothing to delete, or a bad id, is refused', async () => {
	deleted = [];
	const result = await runAction('delete', seeker);
	assert.equal(result.status, 404);
	assert.equal(result.data?.message, "You haven't reviewed this company.");

	assert.equal((await runAction('delete', seeker, {}, 'not-an-id')).status, 404);
	assert.equal(deletes.length, 1);
});
