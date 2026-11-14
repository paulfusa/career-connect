
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

// Recording state for our tests
const state = {
    emails: [] as { to: string; url: string }[],
    savedStatus: 'offered' as 'offered' | 'rejected' | null,
    emailShouldFail: false,
    saveCalls: 0
};

(globalThis as typeof globalThis & {
    __offerTest: typeof state;
}).__offerTest = state;

// Mock external dependencies, not the route itself.
registerHooks({
    resolve(specifier, context, next) {
        if (specifier === '$lib/server/db')
            return { url: 'fake:offer-db', shortCircuit: true };

        if (specifier === '$lib/server/email')
            return { url: 'fake:offer-email', shortCircuit: true };

        if (specifier === '$lib/server/notifications-db')
            return { url: 'fake:offer-notifications', shortCircuit: true };

        if (specifier === '$lib/server/outcomes')
            return { url: 'fake:offer-outcomes', shortCircuit: true };

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
        if (url === 'fake:offer-notifications') {
            return {
                format: 'module',
                source: 'export const notificationService = { createNotification: async () => null };',
                shortCircuit: true
            };
        }
        if (url === 'fake:offer-db') {
            return {
                format: 'module',
                source: `
                    export const db = {
                        select() {
                            const query = {
                                from() { return query; },
                                innerJoin() { return query; },
                                where() {
                                    return Promise.resolve([
                                        { email: 'seeker@example.com' }
                                    ]);
                                }
                            };
                            return query;
                        }
                    };
                `,
                shortCircuit: true
            };
        }

        if (url === 'fake:offer-email') {
            return {
                format: 'module',
                source: `
                    export async function sendJobOfferEmail(to, url) {
                        const state = globalThis.__offerTest;
                        state.emails.push({ to, url });

                        if (state.emailShouldFail) {
                            throw new Error('Email service unavailable');
                        }
                    }
                `,
                shortCircuit: true
            };
        }

        if (url === 'fake:offer-outcomes') {
            return {
                format: 'module',
                source: `
                    export async function findOwnedApplication() {
                        return { id: 'owned-application', userId: 'applicant-1', jobTitle: 'Developer' };
                    }

                    export async function saveOutcome(id, values) {
                        const state = globalThis.__offerTest;
                        state.saveCalls++;

                        if (state.savedStatus === null) {
                            return undefined;
                        }

                        return { id: 'outcome-1', applicationId: id, status: state.savedStatus };
                    }
                `,
                shortCircuit: true
            };
        }

        return next(url, context);
    }
});

const { actions } = await import(
    '../src/routes/(app)/jobs/[id]/applications/+page.server.ts'
);

const applicationId = '22222222-2222-4222-8222-222222222222';

beforeEach(() => {
    state.emails = [];
    state.savedStatus = 'offered';
    state.emailShouldFail = false;
    state.saveCalls = 0;
});

async function submitDecision(status: 'offered' | 'rejected') {
    const data = new FormData();

    data.set('applicationId', applicationId);
    data.set('status', status);
    data.set('message', 'We have carefully reviewed your application and completed the recruitment process. Thank you for your interest in this opportunity.');
    data.set('nextSteps', status === 'offered'
        ? 'Please log in to review the offer and respond.'
        : '');

    const request = new Request('http://localhost:5173/', {
        method: 'POST',
        body: data
    });

    return actions.decide({
        request,
        locals: {
            user: { id: 'recruiter-1', role: 'recruiter' }
        },
        url: new URL(request.url)
    } as never);
}

// TEST 1
test('job offer: sends exactly one email', async () => {
    const result = await submitDecision('offered');

    assert.equal(state.saveCalls, 1);
    assert.equal(state.emails.length, 1);
    assert.equal(state.emails[0].to, 'seeker@example.com');
    assert.equal(
        state.emails[0].url,
        'http://localhost:5173/applications'
    );
    assert.equal(result?.success, 'Decision sent to the applicant.');
});

// TEST 2
test('job rejection: does not send an email', async () => {
    state.savedStatus = 'rejected';

    const result = await submitDecision('rejected');

    assert.equal(state.saveCalls, 1);
    assert.equal(state.emails.length, 0);
    assert.equal(result?.success, 'Decision sent to the applicant.');
});

// TEST 3
test('duplicate decision: does not send another email', async () => {
    state.savedStatus = null;

    const result = await submitDecision('offered');

    assert.equal(state.saveCalls, 1);
    assert.equal(state.emails.length, 0);
    assert.equal(result?.status, 400);
});

// TEST 4
test('email failure: does not undo the job offer', async () => {
    state.emailShouldFail = true;

    const result = await submitDecision('offered');

    assert.equal(state.saveCalls, 1);
    assert.equal(state.emails.length, 1);
    assert.equal(result?.success, 'Decision sent to the applicant.');
});
