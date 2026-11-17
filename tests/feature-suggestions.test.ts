import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { PgDialect } from 'drizzle-orm/pg-core';
import { getTableName, type SQL, type Table } from 'drizzle-orm';
import { isHttpError } from '@sveltejs/kit';

// US-06: tests the suggestion form checks, and the real Suggest a feature and Review suggestions pages
// with a fake database, the same way as follow.test.ts
registerHooks({
	resolve(specifier, context, next) {
		if (specifier === '$lib/server/db' || specifier === './db') return { url: 'fake:suggestion-db', shortCircuit: true };
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
		if (url === 'fake:suggestion-db') {
			return { format: 'module', source: 'export const db = globalThis.__suggestionDb;', shortCircuit: true };
		}
		return next(url, context);
	}
});

const dialect = new PgDialect();
type Select = { table: string; fields: string[]; where?: SQL };
let selects: Select[] = [];
let inserts: { table: string; values: Record<string, unknown> }[] = [];
let updates: { table: string; set: Record<string, unknown>; where?: SQL }[] = [];
let rows: unknown[] = [];
let updated: unknown[] = [{ id: 'x' }];

const db = {
	select(fields: Record<string, unknown> = {}) {
		const call: Select = { table: '', fields: Object.keys(fields) };
		selects.push(call);
		const query = {
			from(table: Table) { call.table = getTableName(table); return query; },
			innerJoin() { return query; },
			where(condition: SQL | undefined) { call.where = condition; return query; },
			orderBy() { return query; },
			then(resolve: (value: unknown[]) => unknown, reject: (reason: unknown) => unknown) {
				return Promise.resolve(rows).then(resolve, reject);
			}
		};
		return query;
	},
	insert(table: Table) {
		return {
			values(values: Record<string, unknown>) {
				inserts.push({ table: getTableName(table), values });
				return Promise.resolve();
			}
		};
	},
	update(table: Table) {
		const record: (typeof updates)[number] = { table: getTableName(table), set: {} };
		const query = {
			set(values: Record<string, unknown>) { record.set = values; return query; },
			where(condition: SQL) { record.where = condition; updates.push(record); return query; },
			returning() { return Promise.resolve(updated); }
		};
		return query;
	}
};
(globalThis as typeof globalThis & { __suggestionDb: typeof db }).__suggestionDb = db;

const { parseSuggestion, parseStatusChange, canReviewSuggestions } = await import('../src/lib/server/feature-suggestions.ts');
const suggestPage = await import('../src/routes/(app)/suggestions/+page.server.ts');
const reviewPage = await import('../src/routes/(app)/suggestions/review/+page.server.ts');

const seeker = { id: 'seeker-1', role: 'job_seeker', isAdmin: false };
const admin = { id: 'admin-1', role: 'recruiter', isAdmin: true };
const ID = '2f1c6c1e-9a4b-4d1e-8f3a-6b7c8d9e0f12';
const good = {
	title: 'Save jobs for later',
	description: 'A button on each job to save it, and a page with the saved jobs.',
	benefit: 'I find jobs on my phone and apply later.'
};

const formOf = (values: Record<string, string>) => {
	const form = new FormData();
	for (const [key, value] of Object.entries(values)) form.set(key, value);
	return form;
};
// the values the query sends to Postgres, to check which user or status it's for
const params = (condition?: SQL) => (condition ? dialect.sqlToQuery(condition).params : []);

async function runAction(page: { actions: Record<string, (event: never) => unknown> }, name: string, me: object, values: Record<string, string>) {
	const request = new Request('http://localhost/', { method: 'POST', body: formOf(values) });
	return page.actions[name]({ locals: { user: me }, request } as never) as Promise<Record<string, unknown> & { status?: number; data?: Record<string, unknown> }>;
}

const openReview = (me: object, query = '') =>
	reviewPage.load({ locals: { user: me }, url: new URL(`http://localhost/suggestions/review${query}`) } as never) as Promise<Record<string, unknown>>;

beforeEach(() => {
	selects = [];
	inserts = [];
	updates = [];
	rows = [];
	updated = [{ id: ID }];
});

test('form: a full suggestion passes, with the spaces around it removed', () => {
	const { values, errors } = parseSuggestion(formOf({ ...good, title: `  ${good.title}  ` }));
	assert.deepEqual(errors, {});
	assert.equal(values.title, good.title);
});

test('form: every field is required', () => {
	const { errors } = parseSuggestion(formOf({ title: ' ', description: '', benefit: '' }));
	assert.equal(errors.title, 'Title is required.');
	assert.equal(errors.description, 'Description is required.');
	assert.equal(errors.benefit, 'How it would help is required.');
});

test('form: fields that are too short or too long are refused', () => {
	assert.equal(parseSuggestion(formOf({ ...good, title: 'Hey' })).errors.title, 'Title needs at least 5 characters.');
	assert.equal(parseSuggestion(formOf({ ...good, description: 'x'.repeat(2001) })).errors.description, 'Description can be at most 2000 characters.');
	assert.equal(parseSuggestion(formOf({ ...good, benefit: 'Short' })).errors.benefit, 'How it would help needs at least 10 characters.');
});

test('form: exactly the minimum and maximum lengths are accepted', () => {
	assert.deepEqual(parseSuggestion(formOf({ title: 'x'.repeat(5), description: 'x'.repeat(20), benefit: 'x'.repeat(10) })).errors, {});
	assert.deepEqual(parseSuggestion(formOf({ title: 'x'.repeat(120), description: 'x'.repeat(2000), benefit: 'x'.repeat(1000) })).errors, {});
});

test('review form: only a real id and a known status are accepted', () => {
	assert.deepEqual(parseStatusChange(formOf({ id: ID, status: 'planned' })), { id: ID, status: 'planned' });
	assert.equal(parseStatusChange(formOf({ id: ID, status: 'approved' })), null);
	assert.equal(parseStatusChange(formOf({ id: 'not-an-id', status: 'planned' })), null);
	assert.equal(parseStatusChange(formOf({ id: ID, status: 'toString' })), null);
});

test('only users with the admin flag can review suggestions', () => {
	assert.equal(canReviewSuggestions(admin), true);
	assert.equal(canReviewSuggestions(seeker), false);
	assert.equal(canReviewSuggestions({ isAdmin: null }), false);
	assert.equal(canReviewSuggestions(undefined), false);
});

test('suggest page: you only see your own suggestions', async () => {
	rows = [{ id: ID, title: good.title, status: 'new', createdAt: new Date() }];
	const page = (await suggestPage.load({ locals: { user: seeker } } as never)) as { mine: unknown[] };
	assert.equal(page.mine.length, 1);
	assert.equal(selects[0].table, 'feature_suggestion');
	assert.deepEqual(params(selects[0].where), ['seeker-1']);
});

test('suggest: a valid suggestion is saved for the signed-in user', async () => {
	// a userId in the form is ignored, the suggestion always belongs to whoever is signed in
	const result = await runAction(suggestPage, 'suggest', seeker, { ...good, userId: 'someone-else' });
	assert.equal(result.success, true);
	assert.equal(inserts.length, 1);
	assert.deepEqual(inserts[0].values, { userId: 'seeker-1', ...good });
});

test('suggest: a wrong form is sent back with the messages and nothing is saved', async () => {
	const result = await runAction(suggestPage, 'suggest', seeker, { ...good, title: '' });
	assert.equal(result.status, 400);
	assert.equal((result.data?.errors as Record<string, string>).title, 'Title is required.');
	assert.equal((result.data?.values as Record<string, string>).description, good.description);
	assert.equal(inserts.length, 0);
});

test('review page: people without the admin flag get a not found page', async () => {
	await assert.rejects(openReview(seeker), (err) => isHttpError(err, 404));
	await assert.rejects(openReview(undefined as never), (err) => isHttpError(err, 404));
	assert.equal(selects.length, 0);
});

test('review page: an admin sees every suggestion, and can filter by status', async () => {
	rows = [{ id: ID }];
	const all = await openReview(admin);
	assert.equal(all.status, null);
	assert.equal(selects[0].where, undefined);

	const planned = await openReview(admin, '?status=planned');
	assert.equal(planned.status, 'planned');
	assert.deepEqual(params(selects[1].where), ['planned']);

	// an unknown status is ignored instead of breaking the page
	assert.equal((await openReview(admin, '?status=nope')).status, null);
});

test('review: an admin can change the status', async () => {
	const result = await runAction(reviewPage, 'status', admin, { id: ID, status: 'under_review' });
	assert.equal(result.success, 'Status saved.');
	assert.equal(updates.length, 1);
	assert.equal(updates[0].set.status, 'under_review');
	assert.ok(updates[0].set.updatedAt instanceof Date);
	assert.deepEqual(params(updates[0].where), [ID]);
});

test('review: someone without the admin flag cannot change a status', async () => {
	await assert.rejects(runAction(reviewPage, 'status', seeker, { id: ID, status: 'planned' }), (err) => isHttpError(err, 404));
	assert.equal(updates.length, 0);
});

test('review: a wrong status or a missing suggestion is refused', async () => {
	assert.equal((await runAction(reviewPage, 'status', admin, { id: ID, status: 'approved' })).status, 400);
	assert.equal(updates.length, 0);

	updated = [];
	const gone = await runAction(reviewPage, 'status', admin, { id: ID, status: 'planned' });
	assert.equal(gone.status, 404);
	assert.equal(gone.data?.message, 'That suggestion no longer exists.');
});
