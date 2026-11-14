import { test, beforeEach, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { PgDialect } from 'drizzle-orm/pg-core';
import { fail } from '@sveltejs/kit';
import type { Application, ApplicationOutcome } from '../src/lib/server/db/schema.ts';
import type { CreateNotificationInput } from '../src/lib/server/notifications.ts';

// Use the real action, parser and saveOutcome transaction. Replace only I/O;
// never load the production database client or notification adapter.
registerHooks({
    resolve(specifier, context, next) {
        if (specifier === '$lib/server/db') return { url: 'fake:outcome-db', shortCircuit: true };
        if (specifier === '$lib/server/notifications-db') return { url: 'fake:outcome-notifications', shortCircuit: true };
        if (specifier === '$lib/server/email') return { url: 'fake:outcome-email', shortCircuit: true };
        if (specifier === './auth.schema') {
            return { url: new URL('../src/lib/server/db/auth.schema.ts', import.meta.url).href, shortCircuit: true };
        }
        if (specifier.startsWith('$lib/')) {
            return { url: new URL(`../src/lib/${specifier.slice(5)}.ts`, import.meta.url).href, shortCircuit: true };
        }
        return next(specifier, context);
    },
    load(url, context, next) {
        if (url === 'fake:outcome-email') {
            return { format: 'module', source: 'export const sendJobOfferEmail = globalThis.__outcomeMocks.sendJobOfferEmail;', shortCircuit: true };
        }
        if (url === 'fake:outcome-db') {
            return { format: 'module', source: 'export const db = globalThis.__outcomeMocks.db;', shortCircuit: true };
        }
        if (url === 'fake:outcome-notifications') {
            return { format: 'module', source: 'export const notificationService = globalThis.__outcomeMocks.notifications;', shortCircuit: true };
        }
        return next(url, context);
    }
});

const applicationId = '11111111-1111-4111-8111-111111111111';
const secondApplicationId = '22222222-2222-4222-8222-222222222222';
const outcomeId = '33333333-3333-4333-8333-333333333333';
const secondOutcomeId = '44444444-4444-4444-8444-444444444444';
const owner = { id: 'recruiter-owner', role: 'recruiter' };
const applicantId = 'applicant-1';
const jobTitle = 'Software developer';
const now = new Date('2026-11-11T12:00:00Z');
const offer = {
    status: 'offered',
    message: 'Your experience and the work you shared during our discussions match the needs of our team. We would like to offer you this position.',
    nextSteps: 'Please reply to our recruiting team to discuss the offer.'
};
type ApplicationState = Pick<Application, 'id' | 'userId' | 'status' | 'updatedAt'> & { recruiterId: string; jobTitle: string };
type Condition = Parameters<PgDialect['sqlToQuery']>[0];
const dialect = new PgDialect();
const applications = new Map<string, ApplicationState>();
const outcomes = new Map<string, ApplicationOutcome>();
const notifications: CreateNotificationInput[] = [];
const emails: { to: string; url: string }[] = [];
const events: string[] = [];
const lookups: { fields: unknown; from: unknown; join: unknown; joinSql: string; sql: string; params: unknown[] }[] = [];
const updates: { values: unknown; sql: string; params: unknown[] }[] = [];
const inserts: { values: unknown; target: unknown }[] = [];
let failAt: 'insert' | 'update' | 'commit' | undefined;
let forceConflict: boolean;
let persistedStatusOverride: string | undefined;
let transactionCount: number;
let notifyResult: () => Promise<{ id: string } | null>;
let emailShouldFail: boolean;
let emailLookupShouldFail: boolean;

const db = {
    select(fields: unknown) {
        let from: unknown;
        let join: unknown;
        let joinSql: string;
        const query = {
            from(table: unknown) { from = table; return query; },
            innerJoin(table: unknown, condition: Condition) {
                join = table;
                joinSql = dialect.sqlToQuery(condition).sql;
                return query;
            },
            async where(condition: Condition) {
                const compiled = dialect.sqlToQuery(condition);
                if (from === application && join === user) {
                    assert.ok(events.includes('commit'));
                    assert.deepEqual(fields, { email: user.email });
                    assert.deepEqual(compiled.params, [applicationId]);
                    events.push('email-lookup');
                    if (emailLookupShouldFail) throw new Error('Email lookup failed');
                    return [{ email: 'applicant@example.com' }];
                }
                lookups.push({ fields, from, join, joinSql, ...compiled });
                const row = applications.get(String(compiled.params[0]));
                return row && row.recruiterId === compiled.params[1]
                    ? [{ id: row.id, userId: row.userId, jobTitle: row.jobTitle }] : [];
            }
        };
        return query;
    },
    async transaction<T>(callback: (tx: object) => Promise<T>): Promise<T> {
        transactionCount++;
        // Model commit/rollback with isolated staged state. This checks the real
        // saveOutcome orchestration, not PostgreSQL transaction implementation.
        const stagedApplications = new Map([...applications].map(([id, row]) => [id, { ...row }]));
        const stagedOutcomes = new Map([...outcomes].map(([id, row]) => [id, { ...row }]));
        const tx = {
            insert(table: unknown) {
                assert.equal(table, applicationOutcome);
                let values: Omit<ApplicationOutcome, 'id' | 'createdAt'>;
                const query = {
                    values(next: typeof values) { values = next; return query; },
                    onConflictDoNothing(options: { target: unknown }) {
                        inserts.push({ values, target: options.target });
                        return query;
                    },
                    async returning() {
                        events.push('outcome-insert');
                        if (failAt === 'insert') throw new Error('Insert failed');
                        if (forceConflict || stagedOutcomes.has(values.applicationId)) return [];
                        const saved: ApplicationOutcome = {
                            ...values,
                            id: values.applicationId === applicationId ? outcomeId : secondOutcomeId,
                            status: persistedStatusOverride ?? values.status,
                            createdAt: now
                        };
                        stagedOutcomes.set(values.applicationId, saved);
                        return [saved];
                    }
                };
                return query;
            },
            update(table: unknown) {
                assert.equal(table, application);
                let values: { status: Application['status']; updatedAt: Date };
                return {
                    set(next: typeof values) {
                        values = next;
                        return {
                            async where(condition: Condition) {
                                const compiled = dialect.sqlToQuery(condition);
                                updates.push({ values, ...compiled });
                                events.push('application-update');
                                if (failAt === 'update') throw new Error('Update failed');
                                const row = stagedApplications.get(String(compiled.params[0]));
                                assert.ok(row);
                                row.status = values.status;
                                row.updatedAt = values.updatedAt;
                            }
                        };
                    }
                };
            }
        };
        try {
            const result = await callback(tx);
            if (failAt === 'commit') throw new Error('Commit failed');
            applications.clear();
            outcomes.clear();
            for (const [id, row] of stagedApplications) applications.set(id, row);
            for (const [id, row] of stagedOutcomes) outcomes.set(id, row);
            events.push('commit');
            return result;
        } catch (error) {
            events.push('rollback');
            throw error;
        }
    }
};
const notificationService = {
    async createNotification(input: CreateNotificationInput) {
        assert.equal(events.at(-1), 'commit');
        assert.ok([...outcomes.values()].some((saved) =>
            input.dedupeKey === `application_outcome:${saved.id}:${input.userId}`));
        events.push('notification');
        notifications.push(input);
        return notifyResult();
    }
};
const mocks = {
    db,
    notifications: notificationService,
    async sendJobOfferEmail(to: string, url: string) {
        assert.ok(events.includes('commit'));
        events.push('email');
        emails.push({ to, url });
        if (emailShouldFail) throw new Error('Email service unavailable');
    }
};
(globalThis as typeof globalThis & { __outcomeMocks: typeof mocks }).__outcomeMocks = mocks;
const { actions } = await import('../src/routes/(app)/jobs/[id]/applications/+page.server.ts');
const { application, applicationOutcome, jobPosting, user } = await import('../src/lib/server/db/schema.ts');

beforeEach(() => {
    applications.clear();
    outcomes.clear();
    applications.set(applicationId, { id: applicationId, userId: applicantId, recruiterId: owner.id, jobTitle, status: 'interview', updatedAt: now });
    notifications.length = emails.length = events.length = lookups.length = updates.length = inserts.length = 0;
    failAt = undefined;
    forceConflict = false;
    persistedStatusOverride = undefined;
    transactionCount = 0;
    notifyResult = async () => ({ id: 'notification-1' });
    emailShouldFail = false;
    emailLookupShouldFail = false;
});

async function decide(fields: Record<string, string> = {}, user: unknown = owner) {
    const data = new FormData();
    for (const [key, value] of Object.entries({ applicationId, ...offer, ...fields })) data.set(key, value);
    return actions.decide({
        locals: { user },
        url: new URL('https://careerconnect.example/jobs/123/applications'),
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

for (const status of ['offered', 'rejected'] as const) {
    test(`US-26: a saved ${status} decision notifies its applicant only after commit`, async () => {
        assert.deepEqual(await decide({ status, message: `  ${offer.message}  ` }), {
            applicationId, success: 'Decision sent to the applicant.'
        });
        assert.deepEqual(events, ['outcome-insert', 'application-update', 'commit', 'notification',
            ...(status === 'offered' ? ['email-lookup', 'email'] : [])]);
        assert.deepEqual(emails, status === 'offered'
            ? [{ to: 'applicant@example.com', url: 'https://careerconnect.example/applications' }]
            : []);
        assert.equal(applications.get(applicationId)!.status, status);
        const saved = outcomes.get(applicationId)!;
        assert.equal(saved.message, offer.message);
        assert.equal(saved.nextSteps, status === 'offered' ? offer.nextSteps : null);
        assert.deepEqual(notifications, [{
            userId: applicantId,
            type: status === 'offered' ? 'job_offer' : 'application_rejected',
            title: status === 'offered' ? 'Job offer received' : 'Application rejected',
            message: status === 'offered'
                ? `You have received a job offer for "${jobTitle}".`
                : `Your application for "${jobTitle}" was rejected.`,
            link: '/applications',
            dedupeKey: `application_outcome:${saved.id}:${applicantId}`
        }]);
        assert.ok(!notifications[0].message.includes(offer.message));
        assert.ok(!notifications[0].message.includes(offer.nextSteps));
    });
}

test('US-03: trusted ownership lookup and original transaction predicates are preserved', async () => {
    await decide();
    assert.equal(lookups[0].from, application);
    assert.equal(lookups[0].join, jobPosting);
    assert.match(lookups[0].joinSql, /"application"\."job_posting_id" = "job_posting"\."id"/);
    assert.match(lookups[0].sql, /"application"\."id" = \$/);
    assert.match(lookups[0].sql, /"job_posting"\."created_by" = \$/);
    assert.deepEqual(lookups[0].params, [applicationId, owner.id]);
    assert.deepEqual(lookups[0].fields, { id: application.id, userId: application.userId, jobTitle: jobPosting.title });
    assert.equal(lookups.length, 1);
    assert.equal(transactionCount, 1);
    assert.equal(inserts[0].target, applicationOutcome.applicationId);
    assert.deepEqual(inserts[0].values, { applicationId, ...offer });
    assert.match(updates[0].sql, /"application"\."id" = \$/);
    assert.deepEqual(updates[0].params, [applicationId]);
    const values = updates[0].values as { status: string; updatedAt: Date };
    assert.equal(values.status, 'offered');
    assert.ok(values.updatedAt instanceof Date);
});

test('US-26: forged notification fields cannot override trusted recipient, job or outcome ID', async () => {
    await decide({ userId: 'attacker', recipientId: 'attacker', jobTitle: 'Forged job',
        outcomeId: 'forged', dedupeKey: 'forged', link: '//attacker.example', type: 'forged' });
    assert.equal(notifications[0].userId, applicantId);
    assert.equal(notifications[0].message, `You have received a job offer for "${jobTitle}".`);
    assert.equal(notifications[0].type, 'job_offer');
    assert.equal(notifications[0].link, '/applications');
    assert.equal(notifications[0].dedupeKey, `application_outcome:${outcomeId}:${applicantId}`);
});

test('US-26: guests and job seekers cannot save or notify', async () => {
    for (const user of [null, { id: applicantId, role: 'job_seeker' }]) {
        assert.deepEqual(await decide({}, user), fail(403, { error: 'Only recruiters can send decisions.' }));
    }
    assert.equal(lookups.length, 0);
    assert.equal(transactionCount, 0);
    assert.deepEqual(notifications, []);
    assert.deepEqual(emails, []);
});

test('US-26: malformed, missing and foreign applications cannot save or notify', async () => {
    const missing = fail(404, { error: 'Application not found.' });
    assert.deepEqual(await decide({ applicationId: 'bad-id' }), missing);
    assert.equal(lookups.length, 0);
    assert.deepEqual(await decide({ applicationId: secondApplicationId }), missing);
    assert.deepEqual(await decide({}, { id: 'another-recruiter', role: 'recruiter' }), missing);
    assert.equal(transactionCount, 0);
    assert.deepEqual(notifications, []);
    assert.deepEqual(emails, []);
});

test('US-26: invalid decisions retain validation responses and never save or notify', async () => {
    const invalidCases: Record<string, string>[] = [
        { status: 'interview' }, { status: '' }, { message: '' }, { message: 'x'.repeat(99) },
        { message: 'x'.repeat(2001) }, { nextSteps: '' }, { nextSteps: 'x'.repeat(2001) }
    ];
    for (const fields of invalidCases) {
        const result = await decide(fields);
        assert.equal(result?.status, 400);
        assert.equal(result?.data.applicationId, applicationId);
        assert.ok(result?.data.errors);
        assert.ok(result?.data.values);
    }
    assert.equal(transactionCount, 0);
    assert.deepEqual(notifications, []);
    assert.deepEqual(emails, []);
});

test('US-26: an existing decision cannot be replaced or notified again', async () => {
    await decide();
    const original = { ...outcomes.get(applicationId)! };
    const savedTime = applications.get(applicationId)!.updatedAt;
    assert.deepEqual(await decide({ status: 'rejected' }), fail(400, {
        applicationId, error: 'A decision was already sent for this application.'
    }));
    assert.deepEqual(outcomes.get(applicationId), original);
    assert.equal(applications.get(applicationId)!.status, 'offered');
    assert.strictEqual(applications.get(applicationId)!.updatedAt, savedTime);
    assert.equal(updates.length, 1);
    assert.equal(notifications.length, 1);
    assert.equal(emails.length, 1);
});

test('US-26: an insert-time outcome conflict skips status update and notification', async () => {
    forceConflict = true;
    assert.deepEqual(await decide(), fail(400, {
        applicationId, error: 'A decision was already sent for this application.'
    }));
    assert.equal(updates.length, 0);
    assert.equal(applications.get(applicationId)!.status, 'interview');
    assert.equal(outcomes.size, 0);
    assert.deepEqual(notifications, []);
    assert.deepEqual(emails, []);
});

for (const stage of ['insert', 'update', 'commit'] as const) {
    test(`US-26: ${stage} failure rolls back staged writes and never notifies`, async () => {
        failAt = stage;
        await assert.rejects(() => decide(), new RegExp(`${stage}`, 'i'));
        assert.equal(outcomes.size, 0);
        assert.equal(applications.get(applicationId)!.status, 'interview');
        assert.strictEqual(applications.get(applicationId)!.updatedAt, now);
        assert.equal(events.at(-1), 'rollback');
        assert.deepEqual(notifications, []);
        assert.deepEqual(emails, []);
    });
}

test('US-26: notification failure preserves both committed writes and sanitized success', async (t) => {
    const logs = captureErrors(t);
    notifyResult = async () => { throw new Error('Sensitive database error'); };
    assert.deepEqual(await decide(), { applicationId, success: 'Decision sent to the applicant.' });
    assert.equal(outcomes.get(applicationId)!.status, 'offered');
    assert.equal(applications.get(applicationId)!.status, 'offered');
    assert.deepEqual(emails, [{ to: 'applicant@example.com', url: 'https://careerconnect.example/applications' }]);
    assert.deepEqual(logs, [['Failed to create application-outcome notification', {
        applicationId, outcomeId, recipientId: applicantId, status: 'offered',
        dedupeKey: `application_outcome:${outcomeId}:${applicantId}`, errorName: 'Error'
    }]]);
    assert.ok(!JSON.stringify(logs).includes('Sensitive'));
    assert.ok(!JSON.stringify(logs).includes(jobTitle));
    assert.ok(!JSON.stringify(logs).includes(offer.message));
    assert.ok(!JSON.stringify(logs).includes(offer.nextSteps));
    assert.equal((await decide())?.status, 400);
    assert.equal(notifications.length, 1);
    assert.equal(logs.length, 1);
    assert.equal(emails.length, 1);
});

for (const stage of ['lookup', 'delivery'] as const) {
    test(`job offer: email ${stage} failure preserves the committed decision and in-app notification`, async (t) => {
        const logs = captureErrors(t);
        emailLookupShouldFail = stage === 'lookup';
        emailShouldFail = stage === 'delivery';
        assert.deepEqual(await decide(), { applicationId, success: 'Decision sent to the applicant.' });
        assert.equal(outcomes.get(applicationId)!.status, 'offered');
        assert.equal(applications.get(applicationId)!.status, 'offered');
        assert.equal(notifications.length, 1);
        assert.equal(emails.length, stage === 'delivery' ? 1 : 0);
        assert.equal(logs.length, 1);
        assert.equal(logs[0][0], 'Job offer email notification failed:');
    });
}

test('job offer: both delivery failures are handled independently after commit', async (t) => {
    const logs = captureErrors(t);
    notifyResult = async () => { throw new Error('Notification unavailable'); };
    emailShouldFail = true;
    assert.deepEqual(await decide(), { applicationId, success: 'Decision sent to the applicant.' });
    assert.equal(outcomes.get(applicationId)!.status, 'offered');
    assert.equal(applications.get(applicationId)!.status, 'offered');
    assert.equal(notifications.length, 1);
    assert.equal(emails.length, 1);
    assert.deepEqual(logs.map((entry) => entry[0]), [
        'Failed to create application-outcome notification',
        'Job offer email notification failed:'
    ]);
});

test('US-26: non-Error notification failures are classified without exposing details', async (t) => {
    const logs = captureErrors(t);
    notifyResult = async () => { throw 'Sensitive rejection'; };
    assert.deepEqual(await decide(), { applicationId, success: 'Decision sent to the applicant.' });
    assert.equal((logs[0][1] as { errorName: string }).errorName, 'UnknownError');
    assert.ok(!JSON.stringify(logs).includes('Sensitive rejection'));
});

test('US-26: notification dedupe returning null is not logged as a failure', async (t) => {
    const logs = captureErrors(t);
    notifyResult = async () => null;
    assert.deepEqual(await decide(), { applicationId, success: 'Decision sent to the applicant.' });
    assert.equal(notifications.length, 1);
    assert.equal(outcomes.size, 1);
    assert.deepEqual(logs, []);
    assert.equal(emails.length, 1);
});

test('US-26: unexpected persisted status is caught after commit without sending an incorrect notification', async (t) => {
    const logs = captureErrors(t);
    // Simulate an unexpected database-returned status, rather than bypassing the
    // real input parser. The defensive check must stay outside saveOutcome.
    persistedStatusOverride = 'unexpected';
    assert.deepEqual(await decide(), { applicationId, success: 'Decision sent to the applicant.' });
    assert.equal(outcomes.get(applicationId)!.status, 'unexpected');
    assert.equal(applications.get(applicationId)!.status, 'offered');
    assert.deepEqual(events, ['outcome-insert', 'application-update', 'commit']);
    assert.deepEqual(notifications, []);
    assert.deepEqual(emails, []);
    assert.deepEqual(logs, [['Failed to create application-outcome notification', {
        applicationId, outcomeId, recipientId: applicantId, status: 'unexpected',
        dedupeKey: `application_outcome:${outcomeId}:${applicantId}`, errorName: 'Error'
    }]]);
});

test('US-26: notification type follows the returned persisted decision', async () => {
    persistedStatusOverride = 'rejected';
    await decide();
    assert.equal(notifications[0].type, 'application_rejected');
    assert.equal(notifications[0].message, `Your application for "${jobTitle}" was rejected.`);
    assert.deepEqual(emails, []);
});

test('US-26: decisions for different applicants remain isolated', async () => {
    applications.set(secondApplicationId, {
        id: secondApplicationId, userId: 'applicant-2', recruiterId: owner.id,
        jobTitle: 'Designer', status: 'applied', updatedAt: now
    });
    await decide();
    await decide({ applicationId: secondApplicationId, status: 'rejected' });
    assert.deepEqual(notifications.map((item) => item.userId), [applicantId, 'applicant-2']);
    assert.deepEqual(notifications.map((item) => item.dedupeKey), [
        `application_outcome:${outcomeId}:${applicantId}`,
        `application_outcome:${secondOutcomeId}:applicant-2`
    ]);
    assert.equal(notifications[1].message, 'Your application for "Designer" was rejected.');
});

test('US-26: notification completion is awaited after the decision transaction commits', async () => {
    let release!: () => void;
    let started!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const entered = new Promise<void>((resolve) => { started = resolve; });
    notifyResult = async () => { started(); await gate; return null; };
    let finished = false;
    const submission = decide().then((result) => { finished = true; return result; });
    try {
        await entered;
        assert.equal(applications.get(applicationId)!.status, 'offered');
        assert.equal(outcomes.size, 1);
        assert.equal(finished, false);
    } finally {
        release();
    }
    assert.deepEqual(await submission, { applicationId, success: 'Decision sent to the applicant.' });
});
