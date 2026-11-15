import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';

registerHooks({
	resolve(specifier, context, next) {
		if (specifier === '$lib/server/db') return { url: 'fake:application-filters-db', shortCircuit: true };
		if (specifier === '$lib/server/notifications-db') return { url: 'fake:application-filters-notifications', shortCircuit: true };
		if (specifier === '$lib/server/email') return { url: 'fake:application-filters-email', shortCircuit: true };
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
		if (url === 'fake:application-filters-db') {
			return { format: 'module', source: 'export const db = globalThis.__applicationFiltersDb;', shortCircuit: true };
		}
		if (url === 'fake:application-filters-notifications') {
			return { format: 'module', source: 'export const notificationService = { createNotification: async () => null };', shortCircuit: true };
		}
		if (url === 'fake:application-filters-email') {
			return { format: 'module', source: 'export async function sendJobOfferEmail() {}', shortCircuit: true };
		}
		return next(url, context);
	}
});

const dialect = new PgDialect();
const owner = { id: 'recruiter-1', role: 'recruiter' };
const jobId = '11111111-1111-4111-8111-111111111111';
const queryLog: { fields: string[]; where?: SQL }[] = [];
let postingRows: Record<string, unknown>[] = [];
let applicantRows: Record<string, unknown>[] = [];

const db = {
	select(fields: Record<string, unknown>) {
		const isPostingQuery = Object.hasOwn(fields, 'title') && Object.hasOwn(fields, 'company');
		const entry: { fields: string[]; where?: SQL } = { fields: Object.keys(fields) };
		queryLog.push(entry);
		const query = {
			from() { return query; },
			innerJoin() { return query; },
			leftJoin() { return query; },
			where(condition: SQL) {
				entry.where = condition;
				return isPostingQuery ? Promise.resolve(postingRows) : query;
			},
			orderBy() { return Promise.resolve(applicantRows); }
		};
		return query;
	}
};
(globalThis as typeof globalThis & { __applicationFiltersDb: typeof db }).__applicationFiltersDb = db;

const { load } = await import('../src/routes/(app)/jobs/[id]/applications/+page.server.ts');

test('US-30: recruiter filters applicants by status and last 7 days, with selections retained', async () => {
	const now = new Date();
	postingRows = [{ id: jobId, title: 'Engineer', company: 'Example Co' }];
	applicantRows = [{
		id: 'application-1',
		applicantId: 'seeker-1',
		applicantName: 'Candidate',
		applicantImage: null,
		applicantEmail: 'candidate@example.test',
		resumeId: null,
		resumeName: null,
		appliedAt: now,
		status: 'interview',
		outcome: null
	}];
	queryLog.length = 0;

	const result = await load({
		params: { id: jobId },
		locals: { user: owner },
		url: new URL(`http://localhost/jobs/${jobId}/applications?status=interview&dateRange=7`)
	} as never) as {
		filters: { status: string; dateRange: string };
		hasFilters: boolean;
		applicants: { id: string; status: string }[];
	};

	assert.equal(result.filters.status, 'interview');
	assert.equal(result.filters.dateRange, '7');
	assert.equal(result.hasFilters, true);
	assert.deepEqual(result.applicants.map(({ id, status }) => ({ id, status })), [
		{ id: 'application-1', status: 'interview' }
	]);

	const applicantQuery = dialect.sqlToQuery(queryLog[1].where!);
	assert.match(applicantQuery.sql, /"application"\."job_posting_id" = \$/);
	assert.match(applicantQuery.sql, /"application"\."status" = \$/);
	assert.match(applicantQuery.sql, /"application"\."created_at" >= \$/);
	assert.ok(applicantQuery.params.includes(jobId));
	assert.ok(applicantQuery.params.includes('interview'));
	const cutoff = applicantQuery.params.find((param) => typeof param === 'string' && param.includes('T'));
	if (typeof cutoff !== 'string') throw new Error('Expected an application date cutoff.');
	assert.ok(Math.abs(Date.parse(cutoff) - (now.getTime() - 7 * 24 * 60 * 60 * 1000)) < 5000);
});
