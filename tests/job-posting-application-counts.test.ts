import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';

registerHooks({
	resolve(specifier, context, next) {
		if (specifier === '$lib/server/db') return { url: 'fake:posting-counts-db', shortCircuit: true };
		if (specifier === './auth.schema') {
			return { url: new URL('../src/lib/server/db/auth.schema.ts', import.meta.url).href, shortCircuit: true };
		}
		if (specifier.startsWith('$lib/')) {
			return { url: new URL(`../src/lib/${specifier.slice(5)}.ts`, import.meta.url).href, shortCircuit: true };
		}
		return next(specifier, context);
	},
	load(url, context, next) {
		if (url === 'fake:posting-counts-db') {
			return { format: 'module', source: 'export const db = globalThis.__postingCountsDb;', shortCircuit: true };
		}
		return next(url, context);
	}
});

const dialect = new PgDialect();
let postings: Record<string, unknown>[] = [];
let counts: { jobPostingId: string; total: number }[] = [];
let countQueryCount = 0;
let countWhere: SQL | undefined;
const db = {
	select(columns: Record<string, unknown>) {
		const isCountQuery = Object.hasOwn(columns, 'total');
		if (isCountQuery) countQueryCount++;
		const query = {
			from() { return query; },
			innerJoin() { return query; },
			where(condition: SQL) {
				if (isCountQuery) countWhere = condition;
				return query;
			},
			orderBy() { return Promise.resolve(postings); },
			groupBy() { return Promise.resolve(counts); }
		};
		return query;
	}
};
(globalThis as typeof globalThis & { __postingCountsDb: typeof db }).__postingCountsDb = db;

const { load } = await import('../src/routes/(app)/jobs/+page.server.ts');

beforeEach(() => {
	postings = [];
	counts = [];
	countQueryCount = 0;
	countWhere = undefined;
});

function posting(id: string, archived: boolean) {
	return {
		id,
		createdBy: 'recruiter-1',
		archived,
		published: true,
		status: 'open',
		applicationDeadline: null,
		createdAt: new Date('2026-10-22T12:00:00Z')
	};
}

async function loadJobs(query: string) {
	return load({
		url: new URL(`http://localhost/jobs?${query}`),
		locals: { user: { id: 'recruiter-1', role: 'recruiter' } }
	} as never);
}

test('US-30: Your postings includes application counts and shows zero when none exist', async () => {
	const firstId = '11111111-1111-4111-8111-111111111111';
	const secondId = '22222222-2222-4222-8222-222222222222';
	postings = [posting(firstId, false), posting(secondId, false)];
	counts = [{ jobPostingId: firstId, total: 3 }];

	const result = await loadJobs('mine') as {
		postings: { id: string; applicationCount: number }[];
	};

	assert.deepEqual(
		result.postings.map(({ id, applicationCount }) => ({ id, applicationCount })),
		[
			{ id: firstId, applicationCount: 3 },
			{ id: secondId, applicationCount: 0 }
		]
	);
	assert.equal(countQueryCount, 1);
	const query = dialect.sqlToQuery(countWhere!);
	assert.match(query.sql, /"application"\."job_posting_id" in/);
	assert.deepEqual(query.params, [firstId, secondId]);
});

test('US-30: archived postings also include their application counts', async () => {
	const archivedId = '33333333-3333-4333-8333-333333333333';
	postings = [posting(archivedId, true)];
	counts = [{ jobPostingId: archivedId, total: 2 }];

	const result = await loadJobs('mine&archived=1') as {
		archivedView: boolean;
		postings: { applicationCount: number }[];
	};

	assert.equal(result.archivedView, true);
	assert.equal(result.postings[0].applicationCount, 2);
	assert.equal(countQueryCount, 1);
});

test('US-30: the public jobs list does not query or expose application counts', async () => {
	postings = [posting('44444444-4444-4444-8444-444444444444', false)];

	const result = await loadJobs('') as {
		mine: boolean;
		postings: { applicationCount: number | null }[];
	};

	assert.equal(result.mine, false);
	assert.equal(countQueryCount, 0);
	assert.equal(result.postings[0].applicationCount, null);
});
