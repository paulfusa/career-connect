import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { PgDialect } from 'drizzle-orm/pg-core';
import { sql, type SQL } from 'drizzle-orm';

// US-28: tests the real jobs page with a fake database, so nothing touches Supabase.
// Same idea as application-status.test.ts
registerHooks({
    resolve(specifier, context, next) {
        if (specifier === '$lib/server/db') return { url: 'fake:jobs-db', shortCircuit: true };
        if (specifier === './auth.schema') {
            return { url: new URL('../src/lib/server/db/auth.schema.ts', import.meta.url).href, shortCircuit: true };
        }
        if (specifier.startsWith('$lib/')) {
            return { url: new URL(`../src/lib/${specifier.slice(5)}.ts`, import.meta.url).href, shortCircuit: true };
        }
        return next(specifier, context);
    },
    load(url, context, next) {
        if (url === 'fake:jobs-db') {
            return { format: 'module', source: 'export const db = globalThis.__jobsDb;', shortCircuit: true };
        }
        return next(url, context);
    }
});

const dialect = new PgDialect();
let where: SQL | undefined;
let order: SQL[] = [];
const db = {
    select() {
        const query = {
            from() { return query; },
            where(condition: SQL) { where = condition; return query; },
            orderBy(...columns: SQL[]) { order = columns; return Promise.resolve([]); }
        };
        return query;
    }
};
(globalThis as typeof globalThis & { __jobsDb: typeof db }).__jobsDb = db;

const { load } = await import('../src/routes/(app)/jobs/+page.server.ts');
const { todayEastern } = await import('../src/lib/server/application.ts');

beforeEach(() => { where = undefined; order = []; });

// opens /jobs?<query> as a job seeker and gives back the SQL it would run
async function searchJobs(query: string) {
    const result = (await load({
        url: new URL(`http://localhost/jobs?${query}`),
        locals: { user: { id: 'seeker-1', role: 'job_seeker' } }
    } as never)) as { search: Record<string, string> };
    return { search: result.search, where: dialect.sqlToQuery(where!), order: dialect.sqlToQuery(sql.join(order, sql`, `)).sql };
}

const salary = 'coalesce("job_posting"."salary_max", "job_posting"."salary_min")';

test('job search filters: minimum salary only shows jobs whose minimum is the same or higher', async () => {
    const { where } = await searchJobs('minSalary=50000');
    assert.match(where.sql, /"job_posting"\."salary_min" >= \$\d+/);
    assert.ok(!where.sql.includes('"job_posting"."salary_max"'));
    assert.ok(where.params.includes(50000));
});

test('job search filters: no salary filter when the minimum salary is empty or wrong', async () => {
    for (const query of ['', 'minSalary=', 'minSalary=-5000', 'minSalary=abc']) {
        const { where } = await searchJobs(query);
        assert.ok(!where.sql.includes('"job_posting"."salary_min"'), query);
    }
});

test('job search filters: date posted only shows jobs posted after the cutoff', async () => {
    const { where } = await searchJobs('postedWithin=7');
    assert.match(where.sql, /"job_posting"\."created_at" >= \$\d+/);
    const cutoff = where.params.find((param) => typeof param === 'string' && param.includes('T'));
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    assert.ok(Math.abs(Date.parse(cutoff as string) - sevenDaysAgo) < 5000);
});

test('job search filters: open jobs only hides closed jobs and jobs past their deadline', async () => {
    const { where } = await searchJobs('openOnly=on');
    assert.match(where.sql, /"job_posting"\."status" = \$\d+/);
    assert.ok(where.sql.includes('"job_posting"."application_deadline" is null'));
    assert.match(where.sql, /"job_posting"\."application_deadline" >= \$\d+/);
    assert.ok(where.params.includes('open'));
    assert.ok(where.params.includes(todayEastern()));
});

test('job search filters: closed jobs still show when the box is not ticked', async () => {
    const { where } = await searchJobs('');
    assert.ok(!where.sql.includes('"job_posting"."status"'));
    assert.ok(!where.sql.includes('"job_posting"."created_at"'));
});

test('job search filters: newest first is the default order', async () => {
    const { order } = await searchJobs('');
    assert.equal(order, '"job_posting"."created_at" desc');
});

test('job search filters: sorting by deadline shows the closest upcoming deadline first', async () => {
    const { order } = await searchJobs('sort=deadline');
    assert.match(order, /^"job_posting"\."application_deadline" < \$\d+, "job_posting"\."application_deadline" asc, "job_posting"\."created_at" desc$/);
});

test('job search filters: sorting by salary shows the highest pay first and jobs with no salary last', async () => {
    const { order } = await searchJobs('sort=salary');
    assert.equal(order, `${salary} desc nulls last, "job_posting"."created_at" desc`);
});

test('job search filters: a sort we do not know goes back to newest first', async () => {
    const { order } = await searchJobs('sort=cheapest');
    assert.equal(order, '"job_posting"."created_at" desc');
});

test('job search filters: the new filters work together with keyword and work mode', async () => {
    const { where } = await searchJobs('keyword=developer&workMode=remote&minSalary=60000&postedWithin=30&openOnly=on');
    assert.ok(where.sql.includes('"job_posting"."title" ilike'));
    assert.ok(where.sql.includes('"job_posting"."work_mode" = '));
    assert.ok(where.sql.includes('"job_posting"."salary_min" >= '));
    assert.ok(where.sql.includes('"job_posting"."created_at" >= '));
    assert.ok(where.sql.includes('"job_posting"."status" = '));
});

// US-19
test('job search filters: from people I follow only shows jobs from people you follow', async () => {
    const { where } = await searchJobs('following=on');
    assert.ok(where.sql.includes('"job_posting"."created_by" in (select "follow"."following_id" from "follow" where "follow"."follower_id" = $'));
    assert.ok(where.params.includes('seeker-1'));
});

test('job search filters: all jobs show when from people I follow is not ticked', async () => {
    const { where } = await searchJobs('');
    assert.ok(!where.sql.includes('"follow"'));
});

test('job search filters: the form keeps the filters you picked', async () => {
    const { search } = await searchJobs('minSalary=60000&postedWithin=30&openOnly=on&sort=salary');
    assert.equal(search.minSalary, '60000');
    assert.equal(search.postedWithin, '30');
    assert.equal(search.openOnly, 'on');
    assert.equal(search.sort, 'salary');
});
