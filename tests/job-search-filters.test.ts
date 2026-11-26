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
let fields: string[] = [];
let join: SQL | undefined;
const db = {
    select(columns: Record<string, unknown>) {
        fields = Object.keys(columns);
        const query = {
            from() { return query; },
            innerJoin(_table: unknown, condition: SQL) { join = condition; return query; },
            where(condition: SQL) { where = condition; return query; },
            orderBy(...columns: SQL[]) { order = columns; return Promise.resolve([]); }
        };
        return query;
    }
};
(globalThis as typeof globalThis & { __jobsDb: typeof db }).__jobsDb = db;

const { load } = await import('../src/routes/(app)/jobs/+page.server.ts');
const { todayEastern } = await import('../src/lib/server/application.ts');

beforeEach(() => { where = undefined; order = []; fields = []; join = undefined; });

// opens /jobs?<query> as a job seeker and gives back the SQL it would run
async function searchJobs(query: string) {
    const result = (await load({
        url: new URL(`http://localhost/jobs?${query}`),
        locals: { user: { id: 'seeker-1', role: 'job_seeker' } }
    } as never)) as { search: Record<string, string> };
    return { search: result.search, where: dialect.sqlToQuery(where!), order: dialect.sqlToQuery(sql.join(order, sql`, `)).sql };
}
async function searchRecruiterJobs(query: string) {
	const result = await load({
		url: new URL(`http://localhost/jobs?${query}`),
		locals: {
			user: { id: 'recruiter-1', role: 'recruiter' }
		}
	} as never);

	return {
		result: result as {
			mine: boolean;
			archivedView: boolean;
			appStatus: string | null;
			activeOnly: boolean;
		},
		where: dialect.sqlToQuery(where!)

	};
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

test('jobs page: each job comes with the name and photo of the recruiter who posted it', async () => {
    await searchJobs('');
    assert.ok(fields.includes('creatorName'));
    assert.ok(fields.includes('creatorImage'));
    assert.equal(dialect.sqlToQuery(join!).sql, '"user"."id" = "job_posting"."created_by"');
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

// US-29: recruiter dashboard application filters

test('US-29: recruiter can filter postings that have applications', async () => {
	const { result, where } = await searchRecruiterJobs('mine&appStatus=all');

	assert.equal(result.mine, true);
	assert.equal(result.appStatus, 'all');

	assert.match(where.sql, /exists\s*\(/i);
	assert.match(where.sql, /"application"\."job_posting_id"\s*=\s*"job_posting"\."id"/);
	assert.doesNotMatch(where.sql, /"application"\."status"\s*=/);

	assert.ok(where.params.includes('recruiter-1'));
});

test('US-29: recruiter can filter postings awaiting review', async () => {
	const { result, where } = await searchRecruiterJobs('mine&appStatus=applied');

	assert.equal(result.appStatus, 'applied');
	assert.match(where.sql, /exists\s*\(/i);
	assert.match(where.sql, /"application"\."status"\s*=\s*\$\d+/);
	assert.ok(where.params.includes('applied'));
});

test('US-29: recruiter can filter postings with interviews', async () => {
	const { result, where } = await searchRecruiterJobs('mine&appStatus=interview');

	assert.equal(result.appStatus, 'interview');
	assert.match(where.sql, /exists\s*\(/i);
	assert.match(where.sql, /"application"\."status"\s*=\s*\$\d+/);
	assert.ok(where.params.includes('interview'));
});

test('US-29: invalid recruiter application filters are ignored', async () => {
	const { result, where } = await searchRecruiterJobs('mine&appStatus=invalid');

	assert.equal(result.appStatus, null);
	assert.doesNotMatch(where.sql, /exists\s*\(/i);
	assert.doesNotMatch(where.sql, /"application"\."status"\s*=/);
});

test('US-29: recruiter application filters restrict postings to their owner', async () => {
	for (const appStatus of ['all', 'applied', 'interview']) {
		const { where } = await searchRecruiterJobs(`mine&appStatus=${appStatus}`);

		assert.match(where.sql, /"job_posting"\."created_by"\s*=\s*\$\d+/);
		assert.match(where.sql, /"job_posting"\."archived"\s*=\s*\$\d+/);

		assert.ok(where.params.includes('recruiter-1'));
		assert.ok(where.params.includes(false));
		assert.match(where.sql, /exists\s*\(/i);
	}
});

test('US-29: recruiter application filters restrict postings to their owner', async () => {
	for (const appStatus of ['all', 'applied', 'interview']) {
		const { result, where } = await searchRecruiterJobs(
			`mine&appStatus=${appStatus}`
		);

		assert.equal(result.mine, true);

		// The posting must belong to the signed-in recruiter.
		const ownerMatch = where.sql.match(
			/"job_posting"\."created_by"\s*=\s*\$(\d+)/
		);

		assert.ok(ownerMatch, 'Missing recruiter ownership restriction');

		const ownerParameterIndex = Number(ownerMatch[1]) - 1;

		assert.equal(
			where.params[ownerParameterIndex],
			'recruiter-1',
			'Posting ownership must use the signed-in recruiter ID'
		);

		// Archived postings must remain excluded.
		const archivedMatch = where.sql.match(
			/"job_posting"\."archived"\s*=\s*\$(\d+)/
		);

		assert.ok(archivedMatch, 'Missing archived-posting restriction');

		assert.equal(
			where.params[Number(archivedMatch[1]) - 1],
			false
		);

		// Filtering must inspect applications linked to the posting.
		assert.match(where.sql, /exists\s*\(/i);
		assert.match(
			where.sql,
			/"application"\."job_posting_id"\s*=\s*"job_posting"\."id"/
		);
	}
});

test('US-29: recruiter application filter works with existing job search', async () => {
	const { result, where } = await searchRecruiterJobs(
		'mine&appStatus=interview&keyword=developer&workMode=remote'
	);

	assert.equal(result.appStatus, 'interview');

	assert.match(where.sql, /"job_posting"\."title" ilike/);
	assert.match(where.sql, /"job_posting"\."work_mode"\s*=\s*\$\d+/);
	assert.match(where.sql, /exists\s*\(/i);

	assert.ok(where.params.includes('interview'));
	assert.ok(where.params.includes('remote'));
	assert.ok(where.params.includes('recruiter-1'));
});

test('US-29: active postings filter enforces recruiter ownership, open status, published and non-archived', async () => {
	const { result, where } = await searchRecruiterJobs('mine&activeOnly=1');

	assert.equal(result.mine, true);
	assert.equal(result.activeOnly, true);

	const expectedConditions = [
		{ column: 'created_by', value: 'recruiter-1' },
		{ column: 'archived', value: false },
		{ column: 'status', value: 'open' },
		{ column: 'published', value: true }
	];

	for (const { column, value } of expectedConditions) {
		const match = where.sql.match(
			new RegExp(`"job_posting"\\."${column}"\\s*=\\s*\\$(\\d+)`)
		);

		assert.ok(match, `Missing condition: ${column}`);

		assert.equal(
			where.params[Number(match[1]) - 1],
			value,
			`Incorrect parameter for ${column}`
		);
	}
});

test('US-29: active postings filter is disabled for archived view', async () => {
	const { result, where } = await searchRecruiterJobs(
		'mine&archived=1&activeOnly=1'
	);

	assert.equal(result.archivedView, true);
	assert.equal(result.activeOnly, false);

	assert.ok(where.params.includes(true));
	assert.doesNotMatch(where.sql, /"job_posting"\."status"\s*=/);
	assert.doesNotMatch(where.sql, /"job_posting"\."published"\s*=/);
});

test('US-29: job seekers cannot activate recruiter active-postings filter', async () => {
	const result = await load({
		url: new URL('http://localhost/jobs?mine&activeOnly=1'),
		locals: {
			user: { id: 'seeker-1', role: 'job_seeker' }
		}
	} as never) as {
		mine: boolean;
		activeOnly: boolean;
	};

	assert.equal(result.mine, false);
	assert.equal(result.activeOnly, false);

	const query = dialect.sqlToQuery(where!);

	assert.doesNotMatch(query.sql, /"job_posting"\."status"\s*=/);
});
