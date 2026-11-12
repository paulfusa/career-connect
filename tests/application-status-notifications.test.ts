import { test, beforeEach, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { PgDialect } from 'drizzle-orm/pg-core';
import { fail } from '@sveltejs/kit';
import type { Application } from '../src/lib/server/db/schema.ts';
import type { CreateNotificationInput } from '../src/lib/server/notifications.ts';

// Run the real action with recording mocks; neither production database client
// nor notification adapter may load. These tests do not verify PostgreSQL locking.
registerHooks({
    resolve(specifier, context, next) {
        if (specifier === '$lib/server/db') return { url: 'fake:transition-db', shortCircuit: true };
        if (specifier === '$lib/server/notifications-db') return { url: 'fake:transition-notifications', shortCircuit: true };
        if (specifier === './auth.schema') {
            return { url: new URL('../src/lib/server/db/auth.schema.ts', import.meta.url).href, shortCircuit: true };
        }
        if (specifier.startsWith('$lib/')) {
            return { url: new URL(`../src/lib/${specifier.slice(5)}.ts`, import.meta.url).href, shortCircuit: true };
        }
        return next(specifier, context);
    },
    load(url, context, next) {
        if (url === 'fake:transition-db') {
            return { format: 'module', source: 'export const db = globalThis.__transitionMocks.db;', shortCircuit: true };
        }
        if (url === 'fake:transition-notifications') {
            return { format: 'module', source: 'export const notificationService = globalThis.__transitionMocks.notifications;', shortCircuit: true };
        }
        return next(url, context);
    }
});

const jobId = '11111111-1111-4111-8111-111111111111';
const applicationId = '22222222-2222-4222-8222-222222222222';
const otherJobId = '33333333-3333-4333-8333-333333333333';
const owner = { id: 'recruiter-owner', role: 'recruiter' };
const applicantId = 'applicant-1';
const jobTitle = 'Software developer';
const originalTime = new Date('2026-11-11T12:00:00Z');
const success = { success: 'Application status updated.' };
const notFound = fail(404, { message: 'Application not found or cannot be updated.' });
const dialect = new PgDialect();
type Condition = Parameters<PgDialect['sqlToQuery']>[0];
type ApplicationState = Pick<Application, 'id' | 'userId' | 'jobPostingId' | 'status' | 'updatedAt'>;
type Query = { kind: string; sql: string; params: unknown[]; from?: unknown; fields?: unknown; join?: { table: unknown; sql: string; params: unknown[] } };

let row: ApplicationState | undefined;
let updateError: Error | undefined;
let notifyResult: () => Promise<{ id: string } | null>;
let changedCount: number;
const queries: Query[] = [];
const notifications: CreateNotificationInput[] = [];
const events: string[] = [];

function isOwned(params: unknown[]): boolean {
    return !!row && row.id === params[0] && row.jobPostingId === params[1]
        && row.jobPostingId === jobId && params[2] === owner.id;
}

const db = {
    update(table: unknown) {
        assert.equal(table, application);
        let values: { status: Application['status']; updatedAt: Date };
        let from: unknown;
        let record: Query;
        const query = {
            set(next: typeof values) { values = next; return query; },
            from(next: unknown) { from = next; return query; },
            where(condition: Condition) {
                record = { kind: 'update', ...dialect.sqlToQuery(condition), from };
                queries.push(record);
                return query;
            },
            async returning(fields: unknown) {
                record.fields = fields;
                if (updateError) throw updateError;
                // Model the conditional update atomically. SQL assertions below
                // separately check that the real action supplies these predicates.
                if (!isOwned(record.params) || !row
                    || !['applied', 'under_review', 'interview'].includes(row.status)
                    || row.status === values.status) return [];
                row.status = values.status;
                row.updatedAt = values.updatedAt;
                changedCount++;
                events.push('changed');
                return [{ id: row.id, userId: row.userId, jobPostingId: row.jobPostingId, status: row.status, jobTitle }];
            }
        };
        return query;
    },
    select(fields: unknown) {
        let from: unknown;
        let join: Query['join'];
        let record: Query;
        const query = {
            from(next: unknown) { from = next; return query; },
            innerJoin(table: unknown, condition: Condition) {
                join = { table, ...dialect.sqlToQuery(condition) };
                return query;
            },
            where(condition: Condition) {
                record = { kind: 'unchanged', ...dialect.sqlToQuery(condition), from, fields, join };
                queries.push(record);
                return query;
            },
            async limit(value: number) {
                assert.equal(value, 1);
                return row && isOwned(record.params) && row.status === record.params[3] ? [{ id: row.id }] : [];
            }
        };
        return query;
    }
};
const notificationService = {
    async createNotification(input: CreateNotificationInput) {
        assert.ok(changedCount > 0);
        events.push('notification');
        notifications.push(input);
        return notifyResult();
    }
};
const mocks = { db, notifications: notificationService };
(globalThis as typeof globalThis & { __transitionMocks: typeof mocks }).__transitionMocks = mocks;

const { actions } = await import('../src/routes/(app)/jobs/[id]/applications/+page.server.ts');
const { application, jobPosting } = await import('../src/lib/server/db/schema.ts');

beforeEach(() => {
    row = { id: applicationId, userId: applicantId, jobPostingId: jobId, status: 'applied', updatedAt: originalTime };
    updateError = undefined;
    notifyResult = async () => ({ id: 'notification-1' });
    changedCount = 0;
    queries.length = notifications.length = events.length = 0;
});

async function update(status: string, options: {
    user?: unknown; jobId?: string; applicationId?: string; fields?: Record<string, string>
} = {}) {
    const data = new FormData();
    for (const [key, value] of Object.entries({ applicationId: options.applicationId ?? applicationId, status, ...options.fields })) {
        data.set(key, value);
    }
    return actions.updateStatus({
        locals: { user: 'user' in options ? options.user : owner },
        params: { id: options.jobId ?? jobId },
        request: new Request('http://localhost/', { method: 'POST', body: data })
    } as never);
}

function captureErrors(t: TestContext) {
    const logs: unknown[][] = [];
    const original = console.error;
    console.error = (...args: unknown[]) => { logs.push(args); };
    t.after(() => { console.error = original; });
    return logs;
}

for (const status of ['under_review', 'interview'] as const) {
    test(`US-26: a genuine ${status} transition notifies the correct applicant`, async () => {
        assert.deepEqual(await update(status), success);
        assert.equal(changedCount, 1);
        assert.equal(row!.status, status);
        assert.notEqual(row!.updatedAt, originalTime);
        assert.deepEqual(events, ['changed', 'notification']);
        assert.equal(notifications.length, 1);
        const { dedupeKey, ...payload } = notifications[0];
        assert.deepEqual(payload, {
            userId: applicantId,
            type: status === 'interview' ? 'interview_invitation' : 'application_update',
            title: status === 'interview' ? 'Application moved to interview' : 'Application under review',
            message: status === 'interview'
                ? `Your application for "${jobTitle}" has moved to the interview stage. No interview date or time has been scheduled through CareerConnect.`
                : `Your application for "${jobTitle}" is now under review.`,
            link: '/applications'
        });
        assert.match(dedupeKey!, new RegExp(`^application_status:${applicationId}:${applicantId}:${status}:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`));
        assert.equal(queries.length, 1);
    });

    test(`US-26: unchanged ${status} preserves timestamp and success without notification`, async () => {
        row!.status = status;
        assert.deepEqual(await update(status), success);
        assert.equal(changedCount, 0);
        assert.strictEqual(row!.updatedAt, originalTime);
        assert.deepEqual(notifications, []);
        const lookup = queries[1];
        assert.equal(lookup.kind, 'unchanged');
        assert.equal(lookup.from, application);
        assert.equal(lookup.join?.table, jobPosting);
        assert.match(lookup.join!.sql, /"job_posting"\."id" = "application"\."job_posting_id"/);
        assert.deepEqual(lookup.params, [applicationId, jobId, owner.id, status]);
        assert.match(lookup.sql, /"application"\."id" = \$/);
        assert.match(lookup.sql, /"application"\."job_posting_id" = \$/);
        assert.match(lookup.sql, /"job_posting"\."created_by" = \$/);
        assert.match(lookup.sql, /"application"\."status" = \$/);
    });
}

test('US-26: the write atomically restricts ownership, URL job, nonfinal status and actual change', async () => {
    await update('interview');
    const write = queries[0];
    assert.equal(write.from, jobPosting);
    assert.match(write.sql, /"application"\."id" = \$/);
    assert.match(write.sql, /"application"\."job_posting_id" = \$/);
    assert.match(write.sql, /"job_posting"\."id" = "application"\."job_posting_id"/);
    assert.match(write.sql, /"job_posting"\."created_by" = \$/);
    assert.match(write.sql, /"application"\."status" in/);
    assert.match(write.sql, /"application"\."status" <> \$/);
    assert.deepEqual(write.params, [applicationId, jobId, owner.id, 'applied', 'under_review', 'interview', 'interview']);
    assert.deepEqual(write.fields, {
        id: application.id, userId: application.userId, jobPostingId: application.jobPostingId,
        status: application.status, jobTitle: jobPosting.title
    });
});

test('US-26: forged notification fields cannot replace trusted returned data', async () => {
    await update('interview', { fields: {
        userId: 'attacker', recipientId: 'attacker', jobTitle: 'Forged job',
        link: '//attacker.example', dedupeKey: 'forged', type: 'forged',
        title: 'Forged title', message: 'Forged message'
    } });
    assert.equal(notifications[0].userId, applicantId);
    assert.equal(notifications[0].type, 'interview_invitation');
    assert.equal(notifications[0].title, 'Application moved to interview');
    assert.ok(notifications[0].message.includes(jobTitle));
    assert.ok(!JSON.stringify(notifications).includes('Forged'));
    assert.equal(notifications[0].link, '/applications');
    assert.ok(notifications[0].dedupeKey?.startsWith(`application_status:${applicationId}:${applicantId}:interview:`));
});

test('US-26: missing, foreign and wrong-job applications cannot change or notify', async () => {
    assert.deepEqual(await update('interview', { user: { id: 'other-recruiter', role: 'recruiter' } }), notFound);
    assert.deepEqual(await update('interview', { jobId: otherJobId }), notFound);
    row = undefined;
    assert.deepEqual(await update('interview'), notFound);
    assert.equal(changedCount, 0);
    assert.deepEqual(notifications, []);
});

test('US-26: unchanged status lookup does not turn unauthorized requests into success', async () => {
    row!.status = 'interview';
    assert.deepEqual(await update('interview', { user: { id: 'other-recruiter', role: 'recruiter' } }), notFound);
    assert.deepEqual(await update('interview', { jobId: otherJobId }), notFound);
    assert.equal(changedCount, 0);
    assert.deepEqual(notifications, []);
});

test('US-26: final applications cannot be changed to either intermediate status', async () => {
    for (const saved of ['offered', 'rejected'] as const) {
        row!.status = saved;
        for (const requested of ['under_review', 'interview']) {
            assert.deepEqual(await update(requested), notFound);
            assert.equal(row!.status, saved);
        }
    }
    assert.equal(changedCount, 0);
    assert.deepEqual(notifications, []);
});

test('US-26: guests, job seekers, invalid statuses and malformed IDs never access persistence', async () => {
    for (const user of [undefined, null, { id: applicantId, role: 'job_seeker' }]) {
        assert.equal((await update('interview', { user }))?.status, 403);
    }
    for (const status of ['applied', 'offered', 'rejected', '', 'unknown', 'constructor']) {
        assert.equal((await update(status))?.status, 400);
    }
    assert.equal((await update('interview', { applicationId: 'bad-id' }))?.status, 404);
    assert.equal((await update('interview', { jobId: 'bad-id' }))?.status, 404);
    assert.deepEqual(queries, []);
    assert.deepEqual(notifications, []);
});

test('US-26: update errors propagate without notification', async () => {
    updateError = new Error('Update failed');
    await assert.rejects(() => update('interview'), (error) => error === updateError);
    assert.equal(row!.status, 'applied');
    assert.strictEqual(row!.updatedAt, originalTime);
    assert.deepEqual(notifications, []);
});

test('US-26: notification failure preserves saved status and logs only safe context', async (t) => {
    const logs = captureErrors(t);
    notifyResult = async () => { throw new Error('Sensitive SQL and credentials'); };
    assert.deepEqual(await update('interview'), success);
    assert.equal(row!.status, 'interview');
    assert.equal(changedCount, 1);
    assert.deepEqual(logs, [['Failed to create application-status notification', {
        applicationId, recipientId: applicantId, status: 'interview',
        dedupeKey: notifications[0].dedupeKey, errorName: 'Error'
    }]]);
    assert.ok(!JSON.stringify(logs).includes('Sensitive'));
    assert.ok(!JSON.stringify(logs).includes(jobTitle));
    assert.deepEqual(await update('interview'), success);
    assert.equal(notifications.length, 1);
    assert.equal(logs.length, 1);
});

test('US-26: non-Error notification failures are safely classified', async (t) => {
    const logs = captureErrors(t);
    notifyResult = async () => { throw 'Sensitive rejection'; };
    assert.deepEqual(await update('under_review'), success);
    assert.equal((logs[0][1] as { errorName: string }).errorName, 'UnknownError');
    assert.ok(!JSON.stringify(logs).includes('Sensitive rejection'));
});

test('US-26: notification dedupe returning null is a successful no-op', async (t) => {
    const logs = captureErrors(t);
    notifyResult = async () => null;
    assert.deepEqual(await update('under_review'), success);
    assert.equal(row!.status, 'under_review');
    assert.equal(notifications.length, 1);
    assert.deepEqual(logs, []);
});

test('US-26: repeated saves and simulated overlapping same-status requests notify once', async () => {
    assert.deepEqual(await Promise.all([update('interview'), update('interview')]), [success, success]);
    const savedTime = row!.updatedAt;
    assert.deepEqual(await update('interview'), success);
    assert.equal(changedCount, 1);
    assert.strictEqual(row!.updatedAt, savedTime);
    assert.equal(notifications.length, 1);
});

test('US-26: genuine transitions back to a previous status receive distinct keys', async () => {
    for (const status of ['under_review', 'interview', 'under_review']) {
        assert.deepEqual(await update(status), success);
    }
    assert.equal(changedCount, 3);
    assert.equal(notifications.length, 3);
    assert.deepEqual(notifications.map((item) => item.type), ['application_update', 'interview_invitation', 'application_update']);
    assert.equal(new Set(notifications.map((item) => item.dedupeKey)).size, 3);
});

test('US-26: notification completion is awaited after status persistence', async () => {
    let release!: () => void;
    let started!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const entered = new Promise<void>((resolve) => { started = resolve; });
    notifyResult = async () => { started(); await gate; return null; };
    let finished = false;
    const submission = update('interview').then((result) => { finished = true; return result; });
    try {
        await entered;
        assert.equal(row!.status, 'interview');
        assert.equal(finished, false);
    } finally {
        release();
    }
    assert.deepEqual(await submission, success);
});
