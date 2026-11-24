
import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';

registerHooks({
	resolve(specifier, context, next) {
		if (specifier === '$lib/server/db') {
			return { url: 'fake:seeker-applications-db', shortCircuit: true };
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
		if (url === 'fake:seeker-applications-db') {
			return {
				format: 'module',
				source: 'export const db = globalThis.__seekerApplicationsDb;',
				shortCircuit: true
			};
		}
		return next(url, context);
	}
});

const dialect = new PgDialect();
let rows: Record<string, unknown>[] = [];
let whereCondition: SQL | undefined;
let queryCount = 0;

const db = {
	select() {
		queryCount++;
		const query = {
			from() { return query; },
			innerJoin() { return query; },
			where(condition: SQL) {
				whereCondition = condition;
				return query;
			},
			orderBy() {
				return Promise.resolve(rows);
			}
		};
		return query;
	}
};

(globalThis as typeof globalThis & {
	__seekerApplicationsDb: typeof db;
}).__seekerApplicationsDb = db;

const { load } = await import('../src/routes/(app)/applications/+page.server.ts');

beforeEach(() => {
	rows = [];
	whereCondition = undefined;
	queryCount = 0;
});


type ApplicationsResult = {
	status: string | null;
	applications: Record<string, unknown>[];
};

async function loadApplications(
	status = '',
	role = 'job_seeker'
): Promise<ApplicationsResult> {
	const url = new URL('http://localhost/applications');

	if (status) {
		url.searchParams.set('status', status);
	}

	const result = await load({
		locals: {
			user: { id: 'seeker-123', role }
		},
		url
	} as never);

	if (!result || typeof result !== 'object' || !('applications' in result)) {
		throw new Error('Dashboard applications loader returned no data');
	}

	return result as ApplicationsResult;
}

function assertQuery(expectedStatus: string | null) {
	assert.ok(whereCondition);
	const query = dialect.sqlToQuery(whereCondition);

	// Every query must belong to the signed-in user.
	assert.match(query.sql, /"application"\."user_id"/);
	assert.ok(query.params.includes('seeker-123'));

	if (expectedStatus) {
		assert.match(query.sql, /"application"\."status"/);
		assert.ok(query.params.includes(expectedStatus));
	} else {
		assert.doesNotMatch(query.sql, /"application"\."status"/);
	}
}

test('US-29: all applications are shown without a status filter', async () => {
	rows = [
		{ id: 'app-1', status: 'applied' },
		{ id: 'app-2', status: 'interview' }
	];

	const result = await loadApplications();

	assert.equal(result.status, null);
	assert.deepEqual(result.applications, rows);
	assertQuery(null);
});

for (const status of ['under_review', 'interview', 'offered'] as const) {
	test(`US-29: dashboard filters applications by ${status}`, async () => {
		rows = [{ id: 'app-1', status }];

		const result = await loadApplications(status);

		assert.equal(result.status, status);
		assert.deepEqual(result.applications, rows);
		assertQuery(status);
	});
}

test('US-29: invalid status is ignored', async () => {
	const result = await loadApplications('invalid_status');

	assert.equal(result.status, null);
	assertQuery(null);
});

test('US-29: status filter still restricts data to the signed-in user', async () => {
	await loadApplications('interview');

	assertQuery('interview');
	assert.equal(queryCount, 1);
});

test('US-29: recruiter cannot access job seeker applications', async () => {
	await assert.rejects(
		() => loadApplications('interview', 'recruiter'),
		(error: unknown) =>
			typeof error === 'object' &&
			error !== null &&
			'status' in error &&
			error.status === 403
	);

	assert.equal(queryCount, 0);
});
