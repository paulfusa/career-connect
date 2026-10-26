import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { PgDialect, getTableConfig } from 'drizzle-orm/pg-core';
import { isHttpError } from '@sveltejs/kit';

// Exercise the real route handlers with a recording database, never Supabase.
registerHooks({
    resolve(specifier, context, next) {
        if (specifier === '$lib/server/db') return { url: 'fake:status-db', shortCircuit: true };
        if (specifier === '$lib/server/db/schema') {
            return { url: new URL('../src/lib/server/db/schema.ts', import.meta.url).href, shortCircuit: true };
        }
        if (specifier === './auth.schema') {
            return { url: new URL('../src/lib/server/db/auth.schema.ts', import.meta.url).href, shortCircuit: true };
        }
        // other $lib files the route imports (US-03's outcomes and reminders) load from src/lib as they are
        if (specifier.startsWith('$lib/')) {
            return { url: new URL(`../src/lib/${specifier.slice(5)}.ts`, import.meta.url).href, shortCircuit: true };
        }
        return next(specifier, context);
    },
    load(url, context, next) {
        if (url === 'fake:status-db') {
            return { format: 'module', source: 'export const db = globalThis.__statusDb;', shortCircuit: true };
        }
        return next(url, context);
    }
});

const dialect = new PgDialect();
const queries: { kind: string; sql: string; params: unknown[]; values?: Record<string, unknown> }[] = [];
let returnedRows: Record<string, unknown>[] = [];
let selectedFields: Record<string, unknown> = {};
const db = {
    select(fields: Record<string, unknown>) {
        selectedFields = fields;
        const query = {
            from() { return query; },
            innerJoin() { return query; },
            where(condition: Parameters<PgDialect['sqlToQuery']>[0]) {
                queries.push({ kind: 'select', ...dialect.sqlToQuery(condition) });
                return query;
            },
            orderBy() { return Promise.resolve(returnedRows); },
            // EXISTS needs a SQL wrapper; use the same real Drizzle SQL structure.
            getSQL() { return conditionSql; }
        };
        let conditionSql: Parameters<PgDialect['sqlToQuery']>[0];
        const originalWhere = query.where;
        query.where = (condition) => { conditionSql = condition; return originalWhere(condition); };
        return query;
    },
    update() {
        let values: Record<string, unknown>;
        const query = {
            set(next: Record<string, unknown>) { values = next; return query; },
            where(condition: Parameters<PgDialect['sqlToQuery']>[0]) {
                queries.push({ kind: 'update', ...dialect.sqlToQuery(condition), values });
                return query;
            },
            returning() { return Promise.resolve(returnedRows); }
        };
        return query;
    }
};
(globalThis as typeof globalThis & { __statusDb: typeof db }).__statusDb = db;

const { actions } = await import('../src/routes/(app)/jobs/[id]/applications/+page.server.ts');
const { load } = await import('../src/routes/(app)/applications/+page.server.ts');
const { application } = await import('../src/lib/server/db/schema.ts');
const jobId = '11111111-1111-4111-8111-111111111111';
const applicationId = '22222222-2222-4222-8222-222222222222';
const owner = { id: 'recruiter-owner', role: 'recruiter' };

beforeEach(() => { queries.length = 0; returnedRows = []; selectedFields = {}; });

async function update(status: string, user: unknown = owner, id = applicationId, postingId = jobId) {
    const body = new FormData();
    body.set('applicationId', id);
    body.set('status', status);
    return actions.updateStatus({
        locals: { user }, params: { id: postingId },
        request: new Request('http://localhost/', { method: 'POST', body })
    } as never);
}

test('US-20: schema defaults to applied and constrains all five stored statuses', () => {
    assert.equal(application.status.default, 'applied');
    assert.equal(application.status.notNull, true);
    assert.deepEqual(application.status.enumValues, ['applied', 'under_review', 'interview', 'offered', 'rejected']);
    const constraint = getTableConfig(application).checks.find((item) => item.name === 'application_status_check');
    assert.ok(constraint);
    assert.match(dialect.sqlToQuery(constraint.value).sql, /'applied'.*'under_review'.*'interview'.*'offered'.*'rejected'/);
});

test('US-20: owner can request either intermediate status with an updated timestamp', async () => {
    for (const status of ['under_review', 'interview']) {
        returnedRows = [{ id: applicationId }];
        assert.deepEqual(await update(status), { success: 'Application status updated.' });
        const saved = queries.findLast((query) => query.kind === 'update')!;
        assert.equal(saved.values?.status, status);
        assert.ok(saved.values?.updatedAt instanceof Date);
        assert.equal(saved.values?.createdAt, undefined);
    }
});

test('US-20: database write scopes application, URL job, recruiter ownership and nonfinal status', async () => {
    await update('interview');
    const write = queries.find((query) => query.kind === 'update')!;
    assert.match(write.sql, /"application"\."id" = \$/);
    assert.match(write.sql, /"application"\."job_posting_id" = \$/);
    assert.match(write.sql, /exists/);
    assert.match(write.sql, /"job_posting"\."id" = "application"\."job_posting_id"/);
    assert.match(write.sql, /"job_posting"\."created_by" = \$/);
    assert.match(write.sql, /"application"\."status" in/);
    assert.deepEqual(write.params, [applicationId, jobId, 'applied', 'under_review', 'interview', owner.id]);
});

test('US-20: no matching owned application returns failure, not success', async () => {
    const result = await update('interview', { id: 'other-recruiter', role: 'recruiter' });
    assert.equal(result?.status, 404);
    assert.equal(queries.find((query) => query.kind === 'update')!.params.at(-1), 'other-recruiter');
});

test('US-20: job seekers and unauthenticated requests cannot write', async () => {
    for (const user of [undefined, { id: 'applicant', role: 'job_seeker' }]) {
        assert.equal((await update('interview', user === undefined ? null : user))?.status, 403);
    }
    assert.equal(queries.length, 0);
});

test('US-20: final statuses, Applied, missing and unknown choices cannot bypass validation', async () => {
    for (const status of ['offered', 'rejected', 'applied', '', 'unknown', 'constructor']) {
        assert.equal((await update(status))?.status, 400);
    }
    assert.equal(queries.length, 0);
});

test('US-20: malformed application and job IDs cannot reach the database', async () => {
    assert.equal((await update('interview', owner, 'bad-id'))?.status, 404);
    assert.equal((await update('interview', owner, applicationId, 'bad-id'))?.status, 404);
    assert.equal(queries.length, 0);
});

test('US-20: My Applications queries the signed-in applicant and returns job, date and status', async () => {
    returnedRows = [{ id: applicationId, title: 'Developer', appliedAt: new Date(), status: 'interview' }];
    const result = await load({ locals: { user: { id: 'applicant-1', role: 'job_seeker' } } } as never);
    assert.deepEqual(result, { applications: returnedRows });
    assert.deepEqual(queries[0].params, ['applicant-1']);
    assert.match(queries[0].sql, /"application"\."user_id" = \$/);
    assert.deepEqual(Object.keys(selectedFields), ['id', 'jobPostingId', 'title', 'company', 'appliedAt', 'status']);
});

test('US-20: My Applications supports no applications', async () => {
    assert.deepEqual(await load({ locals: { user: { id: 'new-applicant', role: 'job_seeker' } } } as never), { applications: [] });
});

test('US-20: My Applications denies recruiters and guests before querying', async () => {
    for (const user of [owner, undefined]) {
        await assert.rejects(async () => load({ locals: { user } } as never), (err) => isHttpError(err, 403));
    }
    assert.equal(queries.length, 0);
});
