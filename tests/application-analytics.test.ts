import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { PgDialect } from 'drizzle-orm/pg-core';
import { isHttpError } from '@sveltejs/kit';

registerHooks({
	resolve(specifier, context, next) {
		if (specifier === '$lib/server/db') return { url: 'fake:analytics-db', shortCircuit: true };
		if (specifier === '$lib/server/db/schema') {
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
		if (url === 'fake:analytics-db') {
			return { format: 'module', source: 'export const db = globalThis.__analyticsDb;', shortCircuit: true };
		}
		return next(url, context);
	}
});

const dialect = new PgDialect();
const queries: { sql: string; params: unknown[] }[] = [];
type TestApplication = {
	id: string;
	jobPostingId: string;
	title: string;
	company: string;
	appliedAt: Date;
	status: 'applied' | 'interview' | 'rejected';
};
let returnedRows: TestApplication[] = [];
let selectedFields: Record<string, unknown> = {};

const db = {
	select(fields: Record<string, unknown>) {
		selectedFields = fields;
		const query = {
			from() {
				return query;
			},
			innerJoin() {
				return query;
			},
			where(condition: Parameters<PgDialect['sqlToQuery']>[0]) {
				queries.push(dialect.sqlToQuery(condition));
				return query;
			},
			orderBy() {
				return Promise.resolve(returnedRows);
			}
		};
		return query;
	}
};

(globalThis as typeof globalThis & { __analyticsDb: typeof db }).__analyticsDb = db;

const { load } = await import('../src/routes/(app)/applications/analytics/+page.server.ts');

beforeEach(() => {
	queries.length = 0;
	returnedRows = [];
	selectedFields = {};
});

function monthKey(date: Date): string {
	return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

test('US-25 acceptance: job seeker sees application history and analytics based on submitted applications', async () => {
	const now = new Date();
	const currentMonthApplicationDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 8, 12));
	const previousMonthApplicationDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 18, 12));
	returnedRows = [
		{
			id: 'application-applied',
			jobPostingId: 'job-1',
			title: 'Frontend Developer',
			company: 'Northstar',
			appliedAt: currentMonthApplicationDate,
			status: 'applied'
		},
		{
			id: 'application-interview',
			jobPostingId: 'job-2',
			title: 'Software Engineer',
			company: 'Contoso',
			appliedAt: previousMonthApplicationDate,
			status: 'interview'
		},
		{
			id: 'application-rejected',
			jobPostingId: 'job-3',
			title: 'Product Developer',
			company: 'Fabrikam',
			appliedAt: currentMonthApplicationDate,
			status: 'rejected'
		}
	];

	const result = await load({
		locals: { user: { id: 'job-seeker-1', role: 'job_seeker' } },
		url: new URL('http://localhost/applications/analytics')
	} as never);
	assert.ok(result);

	assert.equal(result.totalApplications, 3);
	assert.deepEqual(
		result.applications.map((application: TestApplication) => ({
			id: application.id,
			title: application.title,
			company: application.company,
			status: application.status
		})),
		[
			{ id: 'application-applied', title: 'Frontend Developer', company: 'Northstar', status: 'applied' },
			{ id: 'application-interview', title: 'Software Engineer', company: 'Contoso', status: 'interview' },
			{ id: 'application-rejected', title: 'Product Developer', company: 'Fabrikam', status: 'rejected' }
		]
	);
	assert.deepEqual(
		result.statusCounts.map((item: { status: string; count: number }) => [item.status, item.count]),
		[
			['applied', 1],
			['under_review', 0],
			['interview', 1],
			['offered', 0],
			['rejected', 1]
		]
	);
	assert.equal(result.months.length, 12);
	assert.equal(
		result.months.find((month: { key: string; count: number }) => month.key === monthKey(currentMonthApplicationDate))?.count,
		2
	);
	assert.equal(
		result.months.find((month: { key: string; count: number }) => month.key === monthKey(previousMonthApplicationDate))?.count,
		1
	);
	assert.equal(queries.length, 1);
	assert.match(queries[0].sql, /"application"\."user_id" = \$/);
	assert.deepEqual(queries[0].params, ['job-seeker-1']);
	assert.deepEqual(Object.keys(selectedFields), ['id', 'jobPostingId', 'title', 'company', 'appliedAt', 'status']);
});

test('US-25 acceptance: job seeker can filter history by status, while analytics remain complete', async () => {
	returnedRows = [
		{
			id: 'application-applied',
			jobPostingId: 'job-1',
			title: 'Frontend Developer',
			company: 'Northstar',
			appliedAt: new Date('2026-05-08T12:00:00.000Z'),
			status: 'applied'
		},
		{
			id: 'application-interview',
			jobPostingId: 'job-2',
			title: 'Software Engineer',
			company: 'Contoso',
			appliedAt: new Date('2026-04-18T12:00:00.000Z'),
			status: 'interview'
		}
	];

	const result = await load({
		locals: { user: { id: 'job-seeker-2', role: 'job_seeker' } },
		url: new URL('http://localhost/applications/analytics?status=interview')
	} as never);

	assert.ok(result);
	assert.deepEqual(result.applications.map((item: TestApplication) => item.id), ['application-interview']);
	assert.equal(result.statusFilter, 'interview');
	assert.equal(result.totalApplications, 2);
	assert.equal(result.statusCounts.find((item: { status: string; count: number }) => item.status === 'applied')?.count, 1);
	assert.equal(result.statusCounts.find((item: { status: string; count: number }) => item.status === 'interview')?.count, 1);
	assert.equal(result.months.reduce((sum: number, month: { count: number }) => sum + month.count, 0), 2);
	assert.equal(queries.length, 1);
	assert.deepEqual(queries[0].params, ['job-seeker-2']);
});

test('US-25 acceptance: recruiters and guests cannot access job seeker application analytics', async () => {
	for (const user of [{ id: 'recruiter-1', role: 'recruiter' }, undefined]) {
		await assert.rejects(
			async () => {
				await load({
					locals: { user },
					url: new URL('http://localhost/applications/analytics')
				} as never);
			},
			(error: unknown) => isHttpError(error, 403)
		);
	}

	assert.equal(queries.length, 0);
});
