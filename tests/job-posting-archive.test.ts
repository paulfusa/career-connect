import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { isRedirect } from '@sveltejs/kit';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';

registerHooks({
	resolve(specifier, context, next) {
		if (specifier === '$lib/server/db') return { url: 'fake:job-archive-db', shortCircuit: true };
		if (specifier === './auth.schema') {
			return { url: new URL('../src/lib/server/db/auth.schema.ts', import.meta.url).href, shortCircuit: true };
		}
		if (specifier.startsWith('$lib/')) {
			return { url: new URL(`../src/lib/${specifier.slice(5)}.ts`, import.meta.url).href, shortCircuit: true };
		}
		return next(specifier, context);
	},
	load(url, context, next) {
		if (url === 'fake:job-archive-db') {
			return { format: 'module', source: 'export const db = globalThis.__jobArchiveDb;', shortCircuit: true };
		}
		return next(url, context);
	}
});

const dialect = new PgDialect();
const owner = { id: 'recruiter-1', role: 'recruiter' };
const otherRecruiter = { id: 'recruiter-2', role: 'recruiter' };
const seeker = { id: 'seeker-1', role: 'job_seeker' };
const jobId = '11111111-1111-4111-8111-111111111111';
let postings: Record<string, unknown>[] = [];
let applicationCounts: { jobPostingId: string; total: number }[] = [];
let listWhere: SQL | undefined;
let updateWhere: SQL | undefined;
let updateValues: Record<string, unknown> | undefined;

const db = {
	select(fields: Record<string, unknown>) {
		const isCountQuery = Object.hasOwn(fields, 'total');
		const query = {
			from() { return query; },
			innerJoin() { return query; },
			where(condition: SQL) {
				if (!isCountQuery) listWhere = condition;
				return query;
			},
			orderBy() { return Promise.resolve(postings); },
			groupBy() { return Promise.resolve(applicationCounts); }
		};
		return query;
	},
	update() {
		const query = {
			set(values: Record<string, unknown>) { updateValues = values; return query; },
			where(condition: SQL) { updateWhere = condition; return query; },
			returning() {
				const params = dialect.sqlToQuery(updateWhere!).params;
				return Promise.resolve(params[1] === owner.id ? [{ id: jobId }] : []);
			}
		};
		return query;
	}
};
(globalThis as typeof globalThis & { __jobArchiveDb: typeof db }).__jobArchiveDb = db;

const { actions, load } = await import('../src/routes/(app)/jobs/+page.server.ts');

beforeEach(() => {
	postings = [];
	applicationCounts = [];
	listWhere = undefined;
	updateWhere = undefined;
	updateValues = undefined;
});

function posting(archived: boolean) {
	return {
		id: jobId,
		createdBy: owner.id,
		title: 'Engineer',
		company: 'Example Co',
		companyDomain: null,
		location: 'Montreal',
		employmentType: 'full_time',
		workMode: 'hybrid',
		description: 'Build software.',
		status: 'open',
		published: true,
		archived,
		requirements: null,
		applicationDeadline: null,
		salaryMin: null,
		salaryMax: null,
		createdAt: new Date('2026-10-22T12:00:00Z'),
		updatedAt: new Date('2026-10-22T12:00:00Z'),
		creatorName: 'Recruiter',
		creatorImage: null
	};
}

function submitAction(action: 'archive' | 'unarchive', user: typeof owner | typeof otherRecruiter) {
	const form = new FormData();
	form.set('id', jobId);
	return actions[action]({
		request: new Request('http://localhost/jobs?mine', { method: 'POST', body: form }),
		locals: { user }
	} as never);
}

test('US-30: recruiter archives and restores their posting while public listings exclude it', async () => {
	await assert.rejects(
		async () => submitAction('archive', owner),
		(error: unknown) => isRedirect(error) && error.status === 303 && error.location === '/jobs?mine&archived=1'
	);
	assert.equal(updateValues?.archived, true);
	assert.ok(updateValues?.updatedAt instanceof Date);
	const archiveCondition = dialect.sqlToQuery(updateWhere!);
	assert.match(archiveCondition.sql, /"job_posting"\."id" = \$/);
	assert.match(archiveCondition.sql, /"job_posting"\."created_by" = \$/);
	assert.deepEqual(archiveCondition.params, [jobId, owner.id]);

	const denied = await submitAction('unarchive', otherRecruiter);
	assert.equal(denied?.status, 404);
	assert.deepEqual(dialect.sqlToQuery(updateWhere!).params, [jobId, otherRecruiter.id]);

	postings = [];
	const publicJobs = await load({
		url: new URL('http://localhost/jobs'),
		locals: { user: seeker }
	} as never) as { postings: unknown[] };
	assert.equal(publicJobs.postings.length, 0);
	const publicCondition = dialect.sqlToQuery(listWhere!);
	assert.match(publicCondition.sql, /"job_posting"\."archived" = \$/);
	assert.ok(publicCondition.params.includes(false));

	postings = [posting(true)];
	applicationCounts = [{ jobPostingId: jobId, total: 2 }];
	const archivedJobs = await load({
		url: new URL('http://localhost/jobs?mine&archived=1'),
		locals: { user: owner }
	} as never) as { archivedView: boolean; postings: { archived: boolean; applicationCount: number }[] };
	assert.equal(archivedJobs.archivedView, true);
	assert.equal(archivedJobs.postings[0].archived, true);
	assert.equal(archivedJobs.postings[0].applicationCount, 2);
	assert.ok(dialect.sqlToQuery(listWhere!).params.includes(true));

	await assert.rejects(
		async () => submitAction('unarchive', owner),
		(error: unknown) => isRedirect(error) && error.status === 303 && error.location === '/jobs?mine'
	);
	assert.equal(updateValues?.archived, false);
});
