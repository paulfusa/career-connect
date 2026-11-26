
import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';

registerHooks({
	resolve(specifier, context, next) {
		if (specifier === '$lib/server/db') {
			return { url: 'fake:dashboard-db', shortCircuit: true };
		}

		if (specifier === '$lib/server/db/schema') {
			return {
				url: new URL('../src/lib/server/db/schema.ts', import.meta.url).href,
				shortCircuit: true
			};
		}

		if (specifier === './auth.schema') {
			return {
				url: new URL('../src/lib/server/db/auth.schema.ts', import.meta.url).href,
				shortCircuit: true
			};
		}

		if (specifier.startsWith('$lib/')) {
			return {
				url: new URL(`../src/lib/${specifier.slice(5)}.ts`, import.meta.url).href,
				shortCircuit: true
			};
		}

		return next(specifier, context);
	},
	load(url, context, next) {
		if (url === 'fake:dashboard-db') {
			return {
				format: 'module',
				source: 'export const db = globalThis.__dashboardDb;',
				shortCircuit: true
			};
		}

		return next(url, context);
	}
});

const dialect = new PgDialect();

let counts: number[] = [];
let countIndex = 0;
let recentRows: Record<string, unknown>[] = [];
let deadlineRows: Record<string, unknown>[] = [];
let queries: SQL[] = [];
let recentLimit = 0;
let deadlineLimit = 0;

const db = {
	select(fields: Record<string, unknown>) {
		const isCount = Object.hasOwn(fields, 'value');
        const isDeadline = Object.hasOwn(fields, 'applicationDeadline');

		const query = {
			from() {
				return query;
			},
			innerJoin() {
				return query;
			},
			where(condition: SQL) {
				queries.push(condition);

				if (isCount) {
					return Promise.resolve([
						{ value: counts[countIndex++] ?? 0 }
					]);
				}

				return query;
			},
			orderBy() {
				return query;
			},
            limit(value: number) {
                if (isDeadline) {
                    deadlineLimit = value;
                    return Promise.resolve(deadlineRows);
                }

                recentLimit = value;
                return Promise.resolve(recentRows);
            }
		};

		return query;
	}
};

(globalThis as typeof globalThis & {
	__dashboardDb: typeof db;
}).__dashboardDb = db;

const { load } = await import('../src/routes/(app)/+page.server.ts');

beforeEach(() => {
	counts = [];
	countIndex = 0;
	recentRows = [];
	queries = [];
	recentLimit = 0;
    deadlineRows = [];
    deadlineLimit = 0;
});

async function loadDashboard(role: 'job_seeker' | 'recruiter', id: string) {
	return load({
		locals: {
			user: { id, role }
		}
	} as never);
}

test('US-29: job seeker receives correct dashboard statistics', async () => {
	counts = [12, 4, 2, 1];

	const result = await loadDashboard('job_seeker', 'seeker-1');

	assert.ok(result);
	assert.deepEqual(result.stats, {
		totalApplications: 12,
		underReview: 4,
		interviews: 2,
		offers: 1
	});

	assert.equal(countIndex, 4);
});

test('US-29: job seeker only queries their own applications', async () => {
	counts = [5, 2, 1, 0];

	await loadDashboard('job_seeker', 'seeker-123');

	assert.equal(queries.length, 5);

	for (const condition of queries) {
		const query = dialect.sqlToQuery(condition);

		assert.match(query.sql, /"application"\."user_id"/);
		assert.ok(
			query.params.includes('seeker-123'),
			'Every dashboard query must filter by the signed-in user'
		);
	}
});

test('US-29: job seeker receives recent applications with a limit of five', async () => {
	counts = [2, 1, 1, 0];

	const createdAt = new Date('2026-11-20T12:00:00Z');

	recentRows = [
		{
			id: 'app-1',
			jobPostingId: 'job-1',
			jobTitle: 'Software Engineer',
			company: 'Example Company',
			status: 'interview',
			createdAt
		},
		{
			id: 'app-2',
			jobPostingId: 'job-2',
			jobTitle: 'Frontend Developer',
			company: 'Second Company',
			status: 'under_review',
			createdAt
		}
	];

	const result = await loadDashboard('job_seeker', 'seeker-1');

	assert.ok(result);
	assert.equal(recentLimit, 5);
	assert.deepEqual(result.recentApplications, recentRows);
});

test('US-29: job seeker dashboard handles zero applications', async () => {
	counts = [0, 0, 0, 0];
	recentRows = [];

	const result = await loadDashboard('job_seeker', 'new-seeker');

	assert.ok(result);
	assert.deepEqual(result.stats, {
		totalApplications: 0,
		underReview: 0,
		interviews: 0,
		offers: 0
	});
	assert.deepEqual(result.recentApplications, []);
});

test('US-29: recruiter receives correct dashboard statistics', async () => {
	counts = [6, 24, 8, 3];

	const result = await loadDashboard('recruiter', 'recruiter-1');

	assert.ok(result);
	assert.deepEqual(result.stats, {
		activePostings: 6,
		totalApplications: 24,
		awaitingReview: 8,
		interviews: 3
	});

	assert.equal(countIndex, 4);
});

test('US-29: recruiter queries are restricted to their own postings', async () => {
	counts = [4, 15, 5, 2];

	await loadDashboard('recruiter', 'recruiter-123');

	// Deadline query + 4 statistics queries + recent applications.
	assert.equal(queries.length, 6);

	for (const condition of queries) {
		const query = dialect.sqlToQuery(condition);

		assert.match(query.sql, /"job_posting"\."created_by"/);
		assert.ok(
			query.params.includes('recruiter-123'),
			'Every recruiter dashboard query must filter by posting owner'
		);
	}
});

test('US-29: recruiter receives recent applications limited to five', async () => {
	counts = [2, 7, 3, 1];

	recentRows = [
		{
			id: 'application-1',
			jobPostingId: 'job-1',
			applicantName: 'Alex Smith',
			jobTitle: 'Frontend Developer',
			status: 'applied',
			createdAt: new Date('2026-11-20T12:00:00Z')
		},
		{
			id: 'application-2',
			jobPostingId: 'job-2',
			applicantName: 'Jordan Lee',
			jobTitle: 'Software Engineer',
			status: 'interview',
			createdAt: new Date('2026-11-19T12:00:00Z')
		}
	];

	const result = await loadDashboard('recruiter', 'recruiter-1');

	assert.ok(result);
	assert.equal(recentLimit, 5);
	assert.deepEqual(result.recentApplications, recentRows);
});

test('US-29: recruiter receives upcoming posting deadlines', async () => {
	counts = [2, 10, 4, 1];

	const upcomingDate = new Date();
	upcomingDate.setDate(upcomingDate.getDate() + 3);

	deadlineRows = [
		{
			id: 'job-1',
			title: 'Software Developer',
			applicationDeadline: upcomingDate.toISOString().slice(0, 10)
		}
	];

	const result = await loadDashboard('recruiter', 'recruiter-1');

	assert.ok(result);
	assert.equal(deadlineLimit, 5);
	assert.deepEqual(result.upcomingDeadlines, deadlineRows);

	const deadlineQuery = dialect.sqlToQuery(queries[0]);

	assert.match(deadlineQuery.sql, /"application_deadline"/);
	assert.match(deadlineQuery.sql, />=/);
	assert.match(deadlineQuery.sql, /<=/);
	assert.ok(deadlineQuery.params.includes('recruiter-1'));
});

test('US-29: recruiter dashboard handles no postings or applications', async () => {
	counts = [0, 0, 0, 0];
	recentRows = [];
	deadlineRows = [];

	const result = await loadDashboard('recruiter', 'new-recruiter');

	assert.ok(result);
	assert.deepEqual(result.stats, {
		activePostings: 0,
		totalApplications: 0,
		awaitingReview: 0,
		interviews: 0
	});
	assert.deepEqual(result.recentApplications, []);
	assert.deepEqual(result.upcomingDeadlines, []);
});
