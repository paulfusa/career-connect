import { test, beforeEach, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { PgDialect } from 'drizzle-orm/pg-core';
import { fail } from '@sveltejs/kit';
import type { CreateNotificationInput } from '../src/lib/server/notifications.ts';
import type { JobPosting } from '../src/lib/server/db/schema.ts';

// Exercise the real apply action, but never initialize the database client or
// production notification adapter. Each test file has its own Node process.
registerHooks({
    resolve(specifier, context, next) {
        if (specifier === '$lib/server/db') {
            return { url: 'fake:application-db', shortCircuit: true };
        }
        if (specifier === '$lib/server/notifications-db') {
            return { url: 'fake:application-notifications', shortCircuit: true };
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
        if (url === 'fake:application-db') {
            return { format: 'module', source: 'export const db = globalThis.__applicationNotificationMocks.db;', shortCircuit: true };
        }
        if (url === 'fake:application-notifications') {
            return { format: 'module', source: 'export const notificationService = globalThis.__applicationNotificationMocks.notifications;', shortCircuit: true };
        }
        return next(url, context);
    }
});

const jobId = '11111111-1111-4111-8111-111111111111';
const resumeId = '22222222-2222-4222-8222-222222222222';
const applicationId = '33333333-3333-4333-8333-333333333333';
const seeker = { id: 'applicant-1', role: 'job_seeker' };
const recruiterId = 'posting-owner';
const success = { success: 'Application submitted successfully.' };
const dialect = new PgDialect();
type Condition = Parameters<PgDialect['sqlToQuery']>[0];
type Job = Pick<JobPosting, 'id' | 'createdBy' | 'title' | 'status' | 'published' | 'applicationDeadline'>;
type SavedApplication = { id: string; jobPostingId: string; userId: string; resumeId: string };
type SelectQuery = { table: unknown; fields: Record<string, unknown>; sql: string; params: unknown[] };

let job: Job | undefined;
let resumeOwner: string | undefined;
let savedApplications: SavedApplication[];
let forceConflict: boolean;
let insertError: Error | undefined;
let notifyResult: () => Promise<{ id: string } | null>;
const selects: SelectQuery[] = [];
const inserts: { table: unknown; values: Omit<SavedApplication, 'id'>; target: unknown; fields: unknown }[] = [];
const notifications: CreateNotificationInput[] = [];
const events: string[] = [];

const db = {
    select(fields: Record<string, unknown>) {
        let table: unknown;
        const query = {
            from(next: unknown) { table = next; return query; },
            async where(condition: Condition) {
                const compiled = dialect.sqlToQuery(condition);
                selects.push({ table, fields, ...compiled });
                if (table === resume) {
                    return compiled.params[0] === resumeId && compiled.params[1] === resumeOwner
                        ? [{ id: resumeId }] : [];
                }
                if (table === jobPosting) return job && compiled.params[0] === job.id ? [job] : [];
                if (table === application) {
                    return savedApplications.filter((row) =>
                        row.jobPostingId === compiled.params[0] && row.userId === compiled.params[1]);
                }
                throw new Error('Unexpected select table');
            }
        };
        return query;
    },
    insert(table: unknown) {
        let values: Omit<SavedApplication, 'id'>;
        let target: unknown;
        const query = {
            values(next: Omit<SavedApplication, 'id'>) { values = next; return query; },
            onConflictDoNothing(options: { target: unknown }) { target = options.target; return query; },
            async returning(fields: unknown) {
                inserts.push({ table, values, target, fields });
                events.push('insert');
                if (insertError) throw insertError;
                if (forceConflict || savedApplications.some((row) =>
                    row.jobPostingId === values.jobPostingId && row.userId === values.userId)) return [];
                savedApplications.push({ ...values, id: applicationId });
                return [{ id: applicationId }];
            }
        };
        return query;
    }
};
const notificationService = {
    async createNotification(input: CreateNotificationInput) {
        // A notification cannot be attempted before a successful insert.
        assert.ok(savedApplications.some((row) => row.id === applicationId));
        notifications.push(input);
        events.push('notification');
        return notifyResult();
    }
};
const mocks = { db, notifications: notificationService };
(globalThis as typeof globalThis & { __applicationNotificationMocks: typeof mocks }).__applicationNotificationMocks = mocks;

const { actions } = await import('../src/routes/(app)/jobs/[id]/+page.server.ts');
const { application, jobPosting, resume } = await import('../src/lib/server/db/schema.ts');

beforeEach(() => {
    job = {
        id: jobId, createdBy: recruiterId, title: 'Software developer',
        status: 'open', published: true, applicationDeadline: null
    };
    resumeOwner = seeker.id;
    savedApplications = [];
    forceConflict = false;
    insertError = undefined;
    notifyResult = async () => ({ id: 'notification-1' });
    selects.length = inserts.length = notifications.length = events.length = 0;
});

async function submit(options: { user?: typeof seeker; jobId?: string; fields?: Record<string, string> } = {}) {
    const body = new FormData();
    for (const [key, value] of Object.entries({ resumeId, ...options.fields })) body.set(key, value);
    return actions.apply({
        locals: { user: options.user ?? seeker },
        params: { id: options.jobId ?? jobId },
        request: new Request('http://localhost/', { method: 'POST', body })
    } as never);
}

function captureErrors(t: TestContext) {
    const logs: unknown[][] = [];
    const original = console.error;
    console.error = (...args: unknown[]) => { logs.push(args); };
    t.after(() => { console.error = original; });
    return logs;
}

test('US-26: a successful application notifies the stored recruiter after insertion', async () => {
    assert.deepEqual(await submit(), success);
    assert.equal(savedApplications.length, 1);
    assert.deepEqual(events, ['insert', 'notification']);
    assert.deepEqual(notifications, [{
        userId: recruiterId,
        type: 'new_application',
        title: 'New job application',
        message: 'A new application was submitted for "Software developer".',
        link: `/jobs/${jobId}/applications`,
        dedupeKey: `new_application:${applicationId}:${recruiterId}`
    }]);
});

test('US-26: forged notification fields cannot replace trusted posting data', async () => {
    await submit({ fields: {
        userId: 'attacker', recruiterId: 'attacker', createdBy: 'attacker',
        title: 'Forged', message: 'Forged', type: 'forged',
        link: '//attacker.example', dedupeKey: 'forged'
    } });
    assert.equal(notifications[0].userId, recruiterId);
    assert.equal(notifications[0].title, 'New job application');
    assert.equal(notifications[0].message, 'A new application was submitted for "Software developer".');
    assert.equal(notifications[0].type, 'new_application');
    assert.equal(notifications[0].link, `/jobs/${jobId}/applications`);
    assert.equal(notifications[0].dedupeKey, `new_application:${applicationId}:${recruiterId}`);
});

test('US-26: application SQL retains ownership, lookup, insert values and conflict restrictions', async () => {
    await submit();
    assert.equal(selects[0].table, resume);
    assert.match(selects[0].sql, /"resume"\."id" = \$/);
    assert.match(selects[0].sql, /"resume"\."user_id" = \$/);
    assert.deepEqual(selects[0].params, [resumeId, seeker.id]);
    assert.equal(selects[1].table, jobPosting);
    assert.match(selects[1].sql, /"job_posting"\."id" = \$/);
    assert.deepEqual(selects[1].params, [jobId]);
    assert.deepEqual(Object.keys(selects[1].fields), [
        'id', 'createdBy', 'title', 'status', 'published', 'applicationDeadline'
    ]);
    assert.deepEqual(selects[2].params, [jobId, seeker.id]);
    assert.match(selects[2].sql, /"application"\."job_posting_id" = \$/);
    assert.match(selects[2].sql, /"application"\."user_id" = \$/);
    assert.equal(inserts[0].table, application);
    assert.deepEqual(inserts[0].values, { jobPostingId: jobId, userId: seeker.id, resumeId });
    assert.deepEqual(inserts[0].target, [application.jobPostingId, application.userId]);
    assert.deepEqual(inserts[0].fields, { id: application.id });
});

test('US-26: recruiters and malformed IDs cannot insert or notify', async () => {
    assert.equal((await submit({ user: { id: recruiterId, role: 'recruiter' } }))?.status, 403);
    assert.equal((await submit({ jobId: 'bad-id' }))?.status, 404);
    for (const value of ['', 'bad-resume']) {
        assert.equal((await submit({ fields: { resumeId: value } }))?.status, 400);
    }
    assert.equal(selects.length, 0);
    assert.equal(inserts.length, 0);
    assert.equal(notifications.length, 0);
});

test('US-26: missing and foreign resumes cannot insert or notify', async () => {
    for (const owner of [undefined, 'another-applicant']) {
        resumeOwner = owner;
        assert.deepEqual(await submit(), fail(400, { error: 'Selected resume not found.' }));
    }
    assert.equal(inserts.length, 0);
    assert.equal(notifications.length, 0);
});

for (const scenario of ['missing', 'unpublished', 'closed', 'expired'] as const) {
    test(`US-26: a ${scenario} posting cannot insert or notify`, async () => {
        if (scenario === 'missing') job = undefined;
        else if (scenario === 'unpublished') job!.published = false;
        else if (scenario === 'closed') job!.status = 'closed';
        else job!.applicationDeadline = '2000-01-01';
        assert.equal((await submit())?.status, 400);
        assert.equal(inserts.length, 0);
        assert.equal(notifications.length, 0);
    });
}

test('US-26: an existing application preserves the duplicate response without notification', async () => {
    savedApplications.push({ id: applicationId, jobPostingId: jobId, userId: seeker.id, resumeId });
    assert.deepEqual(await submit(), fail(400, { error: 'You have already applied to this job.' }));
    assert.equal(inserts.length, 0);
    assert.equal(notifications.length, 0);
});

test('US-26: an insert-time duplicate conflict does not notify', async () => {
    forceConflict = true;
    assert.deepEqual(await submit(), fail(400, { error: 'You have already applied to this job.' }));
    assert.equal(inserts.length, 1);
    assert.equal(savedApplications.length, 0);
    assert.equal(notifications.length, 0);
});

test('US-26: application insertion errors propagate without notification', async () => {
    insertError = new Error('Application insert failed');
    await assert.rejects(() => submit(), (error) => error === insertError);
    assert.equal(savedApplications.length, 0);
    assert.equal(notifications.length, 0);
});

test('US-26: notification failure is logged without undoing application success', async (t) => {
    const logs = captureErrors(t);
    notifyResult = async () => { throw new Error('Sensitive database details'); };
    assert.deepEqual(await submit(), success);
    assert.equal(savedApplications.length, 1);
    assert.equal(notifications.length, 1);
    assert.deepEqual(logs, [['Failed to create new-application notification', {
        applicationId, recruiterId,
        dedupeKey: `new_application:${applicationId}:${recruiterId}`,
        errorName: 'Error'
    }]]);
    assert.ok(!JSON.stringify(logs).includes('Sensitive database details'));
    // A retry remains a duplicate application, not a second notification attempt.
    assert.equal((await submit())?.status, 400);
    assert.equal(savedApplications.length, 1);
    assert.equal(notifications.length, 1);
    assert.equal(logs.length, 1);
});

test('US-26: a non-Error notification rejection is classified without exposing its contents', async (t) => {
    const logs = captureErrors(t);
    notifyResult = async () => { throw 'Sensitive rejection'; };
    assert.deepEqual(await submit(), success);
    assert.equal((logs[0][1] as { errorName: string }).errorName, 'UnknownError');
    assert.ok(!JSON.stringify(logs).includes('Sensitive rejection'));
});

test('US-26: notification dedupe returning null preserves success without error logging', async (t) => {
    const logs = captureErrors(t);
    notifyResult = async () => null;
    assert.deepEqual(await submit(), success);
    assert.equal(savedApplications.length, 1);
    assert.equal(notifications.length, 1);
    assert.deepEqual(logs, []);
});

test('US-26: repeated submissions never create a second application or notification', async () => {
    assert.deepEqual(await submit(), success);
    assert.equal((await submit())?.status, 400);
    assert.equal(inserts.length, 1);
    assert.equal(savedApplications.length, 1);
    assert.equal(notifications.length, 1);
});

test('US-26: the action awaits notification completion before returning success', async () => {
    let release!: () => void;
    let started!: () => void;
    const pending = new Promise<void>((resolve) => { release = resolve; });
    const entered = new Promise<void>((resolve) => { started = resolve; });
    notifyResult = async () => { started(); await pending; return null; };
    let finished = false;
    const submission = submit().then((result) => { finished = true; return result; });
    try {
        await entered;
        assert.equal(savedApplications.length, 1);
        assert.equal(finished, false);
    } finally {
        release();
    }
    assert.deepEqual(await submission, success);
});
