import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

// US-19: the job page and the applicants list send each person's photo, so the page can show it
// in a circle that links to their profile. Uses a fake database like follow.test.ts
registerHooks({
    resolve(specifier, context, next) {
        if (specifier === '$lib/server/db') return { url: 'fake:photos-db', shortCircuit: true };
        if (specifier === '$lib/server/notifications-db') return { url: 'fake:photos-notifications', shortCircuit: true };
        if (specifier === '$lib/server/email') return { url: 'fake:photos-email', shortCircuit: true };
        if (specifier === './auth.schema') {
            return { url: new URL('../src/lib/server/db/auth.schema.ts', import.meta.url).href, shortCircuit: true };
        }
        if (specifier.startsWith('$lib/')) {
            return { url: new URL(`../src/lib/${specifier.slice(5)}.ts`, import.meta.url).href, shortCircuit: true };
        }
        return next(specifier, context);
    },
    load(url, context, next) {
        if (url === 'fake:photos-db') return { format: 'module', source: 'export const db = globalThis.__photosDb;', shortCircuit: true };
        if (url === 'fake:photos-notifications') {
            return { format: 'module', source: 'export const notificationService = { createNotification: async () => null };', shortCircuit: true };
        }
        if (url === 'fake:photos-email') return { format: 'module', source: 'export async function sendJobOfferEmail() {}', shortCircuit: true };
        return next(url, context);
    }
});

// every select gives back whatever answer() returns for the fields it asked for
let answer: (fields: string[]) => unknown[] = () => [];
const db = {
    select(fields: Record<string, unknown> = {}) {
        const keys = Object.keys(fields);
        const query = {
            from() { return query; },
            innerJoin() { return query; },
            leftJoin() { return query; },
            where() { return query; },
            orderBy() { return query; },
            then(resolve: (rows: unknown[]) => unknown, reject: (reason: unknown) => unknown) {
                return Promise.resolve(answer(keys)).then(resolve, reject);
            }
        };
        return query;
    }
};
(globalThis as typeof globalThis & { __photosDb: typeof db }).__photosDb = db;

const jobPage = await import('../src/routes/(app)/jobs/[id]/+page.server.ts');
const applicantsPage = await import('../src/routes/(app)/jobs/[id]/applications/+page.server.ts');

const jobId = '11111111-1111-4111-8111-111111111111';
const photo = 'https://example.com/photo.png';

beforeEach(() => {
    answer = () => [];
});

test("job page: sends the recruiter's name and photo", async () => {
    answer = (fields) => {
        if (fields.includes('creatorImage')) {
            const posting = { id: jobId, published: true, createdBy: 'recruiter-1', status: 'open', applicationDeadline: null };
            return [{ posting, creatorName: 'Hiring company', creatorImage: photo, companyProfile: null }];
        }
        if (fields.includes('total')) return [{ total: 0 }];
        return [];
    };
    const page = (await jobPage.load({ params: { id: jobId }, locals: { user: { id: 'seeker-1', role: 'job_seeker' } } } as never)) as Record<string, unknown>;
    assert.equal(page.creatorName, 'Hiring company');
    assert.equal(page.creatorImage, photo);
});

test("applicants page: sends each applicant's id and photo for the link to their profile", async () => {
    answer = (fields) => {
        if (fields.includes('title')) return [{ id: jobId, title: 'Engineer', company: 'Shopify' }];
        if (fields.includes('applicantImage')) {
            return [{ id: 'application-1', applicantId: 'seeker-1', applicantName: 'Find jobs', applicantImage: photo, appliedAt: new Date(), outcome: null }];
        }
        return [];
    };
    const page = (await applicantsPage.load({ params: { id: jobId }, locals: { user: { id: 'recruiter-1', role: 'recruiter' } } } as never)) as { applicants: Record<string, unknown>[] };
    assert.equal(page.applicants[0].applicantId, 'seeker-1');
    assert.equal(page.applicants[0].applicantImage, photo);
});
