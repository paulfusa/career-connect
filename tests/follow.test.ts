import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { PgDialect } from 'drizzle-orm/pg-core';
import { getTableName, type SQL } from 'drizzle-orm';
import { isHttpError, isRedirect } from '@sveltejs/kit';

// US-19: tests the real profile and Following pages with a fake database, so nothing touches Supabase.
// Same idea as application-status.test.ts
registerHooks({
    resolve(specifier, context, next) {
        if (specifier === '$lib/server/db' || specifier === './db') return { url: 'fake:follow-db', shortCircuit: true };
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
        if (url === 'fake:follow-db') {
            return { format: 'module', source: 'export const db = globalThis.__followDb;', shortCircuit: true };
        }
        return next(url, context);
    }
});

type Select = { table: string; fields: string[]; where?: SQL; joins: SQL[] };
const dialect = new PgDialect();
let selects: Select[] = [];
let inserts: { table: string; values: Record<string, unknown>; onConflict?: { target: unknown[] } }[] = [];
let deletes: { table: string; where: SQL }[] = [];
// what each select gives back, and what the insert gives back ([] means it hit the unique pair)
let answer: (select: Select) => unknown[] = () => [];
let inserted: unknown[] = [{ id: 'follow-1' }];

const db = {
    select(fields: Record<string, unknown> = {}) {
        const call: Select = { table: '', fields: Object.keys(fields), joins: [] };
        selects.push(call);
        const query = {
            from(table: Parameters<typeof getTableName>[0]) { call.table = getTableName(table); return query; },
            innerJoin() { return query; },
            leftJoin(_table: unknown, condition: SQL) { call.joins.push(condition); return query; },
            where(condition: SQL) { call.where = condition; return query; },
            orderBy() { return query; },
            limit() { return query; },
            then(resolve: (rows: unknown[]) => unknown, reject: (reason: unknown) => unknown) {
                return Promise.resolve(answer(call)).then(resolve, reject);
            }
        };
        return query;
    },
    insert(table: Parameters<typeof getTableName>[0]) {
        const record: (typeof inserts)[number] = { table: getTableName(table), values: {} };
        const query = {
            values(values: Record<string, unknown>) { record.values = values; inserts.push(record); return query; },
            onConflictDoNothing(config: { target: unknown[] }) { record.onConflict = config; return query; },
            returning() { return Promise.resolve(inserted); }
        };
        return query;
    },
    delete(table: Parameters<typeof getTableName>[0]) {
        return { where(condition: SQL) { deletes.push({ table: getTableName(table), where: condition }); return Promise.resolve(); } };
    }
};
(globalThis as typeof globalThis & { __followDb: typeof db }).__followDb = db;

const profilePage = await import('../src/routes/(app)/profile/[id]/+page.server.ts');
const followingPage = await import('../src/routes/(app)/following/+page.server.ts');
const peoplePage = await import('../src/routes/(app)/people/+page.server.ts');
const { follow } = await import('../src/lib/server/db/schema.ts');

const seeker = { id: 'seeker-1', role: 'job_seeker' };
const recruiter = { id: 'recruiter-1', role: 'recruiter' };

beforeEach(() => {
    selects = [];
    inserts = [];
    deletes = [];
    answer = () => [];
    inserted = [{ id: 'follow-1' }];
});

// the user row the pages look up, by role
const userIs = (role: string) => (select: Select) => (select.table === 'user' ? [{ id: 'target-1', name: 'Someone', email: 'someone@example.com', image: null, role, profile: null }] : []);

async function openProfile(me: { id: string; role: string }, id = 'target-1') {
    return profilePage.load({ params: { id }, locals: { user: me } } as never) as Promise<Record<string, unknown>>;
}

async function runAction(page: { actions: Record<string, (event: never) => unknown> }, name: string, me: { id: string; role: string }, id = 'target-1', form: Record<string, string> = {}) {
    const body = new FormData();
    for (const [key, value] of Object.entries(form)) body.set(key, value);
    return page.actions[name]({ params: { id }, locals: { user: me }, request: new Request('http://localhost/', { method: 'POST', body }) } as never) as Promise<{ status?: number; data?: { message?: string }; success?: string }>;
}

test("profile: a job seeker can open a recruiter's profile and see the follower count", async () => {
    answer = (select) => {
        if (select.fields.includes('count')) return [{ count: 3 }];
        return userIs('recruiter')(select);
    };
    const page = await openProfile(seeker);
    assert.equal(page.followers, 3);
    assert.equal(page.following, false);
});

test('profile: shows Unfollow when you already follow them', async () => {
    answer = (select) => {
        if (select.fields.includes('count')) return [{ count: 1 }];
        if (select.table === 'follow') return [{ id: 'follow-1' }];
        return userIs('recruiter')(select);
    };
    assert.equal((await openProfile(seeker)).following, true);
});

test('profile: people with the same role get a not found page', async () => {
    for (const [me, role] of [[seeker, 'job_seeker'], [recruiter, 'recruiter']] as const) {
        answer = userIs(role);
        await assert.rejects(openProfile(me), (err) => isHttpError(err, 404));
    }
});

test('profile: an unknown user gets the same not found page', async () => {
    await assert.rejects(openProfile(seeker), (err) => isHttpError(err, 404));
});

test('profile: your own id goes to your own profile', async () => {
    await assert.rejects(openProfile(seeker, seeker.id), (err) => isRedirect(err) && err.location === '/profile');
});

test('follow: a job seeker can follow a recruiter', async () => {
    answer = (select) => (select.table === 'user' ? [{ id: 'target-1', role: 'recruiter' }] : []);
    const result = await runAction(profilePage, 'follow', seeker);
    assert.equal(result.success, 'You now follow this person.');
    assert.deepEqual(inserts[0].values, { followerId: 'seeker-1', followingId: 'target-1' });
});

test('follow: a recruiter can follow a job seeker', async () => {
    answer = (select) => (select.table === 'user' ? [{ id: 'target-1', role: 'job_seeker' }] : []);
    assert.equal((await runAction(profilePage, 'follow', recruiter)).success, 'You now follow this person.');
    assert.equal(inserts.length, 1);
});

test('follow: you cannot follow yourself', async () => {
    answer = (select) => (select.table === 'user' ? [{ id: seeker.id, role: 'job_seeker' }] : []);
    const result = await runAction(profilePage, 'follow', seeker, seeker.id);
    assert.equal(result.status, 400);
    assert.equal(result.data?.message, "You can't follow yourself.");
    assert.equal(inserts.length, 0);
});

test('follow: you cannot follow someone with the same role or an unknown user', async () => {
    answer = (select) => (select.table === 'user' ? [{ id: 'target-1', role: 'job_seeker' }] : []);
    assert.equal((await runAction(profilePage, 'follow', seeker)).data?.message, 'User not found.');
    answer = () => [];
    assert.equal((await runAction(profilePage, 'follow', seeker)).data?.message, 'User not found.');
    assert.equal(inserts.length, 0);
});

test('follow: following the same person twice does not add a second follow', async () => {
    answer = (select) => (select.table === 'user' ? [{ id: 'target-1', role: 'recruiter' }] : []);
    inserted = [];
    const result = await runAction(profilePage, 'follow', seeker);
    assert.equal(result.status, 400);
    assert.equal(result.data?.message, 'You already follow this person.');
    assert.deepEqual(inserts[0].onConflict?.target, [follow.followerId, follow.followingId]);
});

test('unfollow: only removes your own follow of that person', async () => {
    await runAction(profilePage, 'unfollow', seeker);
    const { sql, params } = dialect.sqlToQuery(deletes[0].where);
    assert.equal(deletes[0].table, 'follow');
    assert.match(sql, /"follow"\."follower_id" = \$\d+ and "follow"\."following_id" = \$\d+/);
    assert.deepEqual(params, ['seeker-1', 'target-1']);
});

test('following page: only lists the people you follow', async () => {
    await followingPage.load({ locals: { user: seeker } } as never);
    const { sql, params } = dialect.sqlToQuery(selects[0].where!);
    assert.match(sql, /"follow"\."follower_id" = \$\d+/);
    assert.deepEqual(params, ['seeker-1']);
});

test('following page: unfollow only removes your own follow and needs a user', async () => {
    await runAction(followingPage, 'unfollow', seeker, '', { userId: 'target-1' });
    assert.deepEqual(dialect.sqlToQuery(deletes[0].where).params, ['seeker-1', 'target-1']);
    const missing = await runAction(followingPage, 'unfollow', seeker, '', {});
    assert.equal(missing.status, 400);
    assert.equal(deletes.length, 1);
});

// opens /people?<query> and gives back what the page got and the SQL it ran
async function openPeople(me: { id: string; role: string }, query = '') {
    const page = (await peoplePage.load({ url: new URL(`http://localhost/people?${query}`), locals: { user: me } } as never)) as { people: unknown[]; search: string; more: boolean };
    const select = selects[0];
    return { page, where: dialect.sqlToQuery(select.where!), joins: select.joins.map((join) => dialect.sqlToQuery(join)) };
}

test('people page: a job seeker only sees recruiters who verified their email', async () => {
    const { where } = await openPeople(seeker);
    assert.match(where.sql, /"user"\."role" = \$\d+ and "user"\."email_verified" = \$\d+/);
    assert.deepEqual(where.params, ['recruiter', true]);
});

test('people page: a recruiter only sees job seekers', async () => {
    const { where } = await openPeople(recruiter);
    assert.deepEqual(where.params, ['job_seeker', true]);
});

test('people page: search looks at the name, headline, job title and company', async () => {
    const { page, where } = await openPeople(seeker, 'q=%20shop%20');
    for (const column of ['"user"."name"', '"profile"."headline"', '"profile"."job_title"', '"profile"."company"']) {
        assert.ok(where.sql.includes(`${column} ilike $`), column);
    }
    assert.ok(where.params.includes('%shop%'));
    assert.equal(page.search, 'shop');
});

test('people page: shows which people you already follow', async () => {
    answer = () => [{ id: 'recruiter-1', name: 'Someone', followingSince: new Date() }];
    const { page, joins } = await openPeople(seeker);
    const followJoin = joins.find((join) => join.sql.includes('"follow"'));
    assert.match(followJoin!.sql, /"follow"\."follower_id" = \$\d+ and "follow"\."following_id" = "user"\."id"/);
    assert.deepEqual(followJoin!.params, ['seeker-1']);
    assert.equal(page.people.length, 1);
});

test('people page: says when there are more people than the page shows', async () => {
    answer = () => Array.from({ length: 50 }, (_, i) => ({ id: `recruiter-${i}` }));
    assert.equal((await openPeople(seeker)).page.more, true);
    answer = () => [{ id: 'recruiter-1' }];
    assert.equal((await openPeople(seeker)).page.more, false);
});
