import { test, beforeEach, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { fail, isRedirect, redirect } from '@sveltejs/kit';
import { createNotificationService, type NotificationStore } from '../src/lib/server/notifications.ts';
import type { Notification } from '../src/lib/server/db/schema.ts';

registerHooks({
	resolve(specifier, context, next) {
		const fakes: Record<string, string> = {
			'$lib/server/db': 'fake:inbox-db',
			'$lib/server/notifications-db': 'fake:inbox-service',
			'$lib/server/auth': 'fake:inbox-auth',
			'$app/environment': 'fake:inbox-environment',
			'better-auth/svelte-kit': 'fake:inbox-auth-handler'
		};
		if (specifier in fakes) return { url: fakes[specifier], shortCircuit: true };
		if (specifier === './auth.schema') return { url: new URL('../src/lib/server/db/auth.schema.ts', import.meta.url).href, shortCircuit: true };
		if (specifier.startsWith('$lib/')) return { url: new URL(`../src/lib/${specifier.slice(5)}.ts`, import.meta.url).href, shortCircuit: true };
		return next(specifier, context);
	},
	load(url, context, next) {
		const sources: Record<string, string> = {
			'fake:inbox-db': 'export const db = globalThis.__inboxMocks.db;',
			'fake:inbox-service': 'export const notificationService = globalThis.__inboxMocks.service;',
			'fake:inbox-auth': 'export const auth = { api: { getSession: async () => globalThis.__inboxMocks.session() } };',
			'fake:inbox-environment': 'export const building = false;',
			'fake:inbox-auth-handler': 'export const svelteKitHandler = ({ event, resolve }) => resolve(event);'
		};
		if (url in sources) return { format: 'module', source: sources[url], shortCircuit: true };
		return next(url, context);
	}
});

const seeker = { id: 'seeker-1', role: 'job_seeker', emailVerified: true, email: 'seeker@example.invalid' };
const recruiter = { id: 'recruiter-1', role: 'recruiter', emailVerified: true, email: 'recruiter@example.invalid' };
const expiresAt = new Date('2099-01-01T00:00:00Z');
const now = new Date('2026-11-12T12:00:00Z');
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
let rows: Notification[] = [];
let serviceError: unknown = undefined;
let authSession: unknown = null;
const calls = { list: [] as unknown[][], count: [] as unknown[][], mark: [] as unknown[][], profile: 0, storageMark: 0 };

const store: NotificationStore = {
	async insert() { throw new Error('Creation must never be exposed'); },
	async list(userId, limit) {
		return rows.filter((row) => row.userId === userId)
			.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id)).slice(0, limit);
	},
	async countUnread(userId) { return rows.filter((row) => row.userId === userId && row.readAt === null).length; },
	async markRead(notificationId, userId) {
		calls.storageMark++;
		const row = rows.find((row) => row.id === notificationId && row.userId === userId);
		if (!row) return false;
		row.readAt ??= now;
		return true;
	}
};
const realService = createNotificationService(store);
const service = {
	async getNotifications(...args: Parameters<typeof realService.getNotifications>) {
		calls.list.push(args);
		if (serviceError !== undefined) throw serviceError;
		return realService.getNotifications(...args);
	},
	async countUnreadNotifications(...args: Parameters<typeof realService.countUnreadNotifications>) {
		calls.count.push(args);
		if (serviceError !== undefined) throw serviceError;
		return realService.countUnreadNotifications(...args);
	},
	async markNotificationAsRead(...args: Parameters<typeof realService.markNotificationAsRead>) {
		calls.mark.push(args);
		if (serviceError !== undefined) throw serviceError;
		return realService.markNotificationAsRead(...args);
	}
};
const db = {
	select() {
		return { from: () => ({ where: async () => { calls.profile++; return []; } }) };
	}
};
const mocks = { db, service, session: () => authSession };
(globalThis as typeof globalThis & { __inboxMocks: typeof mocks }).__inboxMocks = mocks;

const { load: layoutLoad } = await import('../src/routes/(app)/+layout.server.ts');
const { load: inboxLoad, actions } = await import('../src/routes/(app)/notifications/+page.server.ts');
const { handle } = await import('../src/hooks.server.ts');

beforeEach(() => {
	rows = [];
	serviceError = undefined;
	authSession = null;
	calls.list.length = calls.count.length = calls.mark.length = 0;
	calls.profile = calls.storageMark = 0;
});

function seed(userId: string, n: number, link: string | null = '/applications') {
	rows.push({ id: id(n), userId, type: 'application_update', title: `Update ${n}`, message: `Message ${n}`,
		link, readAt: null, createdAt: new Date(now.getTime() + n * 1000), dedupeKey: `private:${n}` });
}

function event(user: unknown = seeker) {
	const dependencies: string[] = [];
	const headers: Record<string, string> = {};
	return {
		locals: { user, session: { expiresAt } },
		url: new URL('http://localhost/notifications?userId=forged'),
		depends: (...keys: string[]) => dependencies.push(...keys),
		setHeaders: (values: Record<string, string>) => Object.assign(headers, values),
		dependencies, headers
	};
}

async function mark(notificationId: string | Blob | null, user: unknown = seeker) {
	const body = new FormData();
	if (notificationId !== null) body.set('notificationId', notificationId);
	body.set('userId', recruiter.id);
	body.set('recipientId', recruiter.id);
	return actions.markRead({ ...event(user), request: new Request('http://localhost/notifications?/markRead', { method: 'POST', body }) } as never);
}

function captureErrors(t: TestContext) {
	const logs: unknown[][] = [];
	const original = console.error;
	console.error = (...args: unknown[]) => { logs.push(args); };
	t.after(() => { console.error = original; });
	return logs;
}

for (const user of [seeker, recruiter]) {
	test(`inbox: ${user.role} sees only their own list and unread count`, async () => {
		seed(seeker.id, 1);
		seed(recruiter.id, 2);
		const context = event(user);
		const [layout, inbox] = await Promise.all([layoutLoad(context as never), inboxLoad(context as never)]);
		assert.equal(layout.notificationUnreadCount, 1);
		assert.deepEqual(inbox.notifications?.map((row) => row.id), [user.id === seeker.id ? id(1) : id(2)]);
		assert.deepEqual(calls.count, [[user]]);
		assert.deepEqual(calls.list, [[user]]);
		assert.equal(calls.profile, 1);
		assert.equal(context.headers['cache-control'], 'private, no-store');
		assert.deepEqual(context.dependencies, ['app:notifications', 'app:notifications']);
		assert.equal(inbox.notificationOwnerId, user.id);
		assert.strictEqual(inbox.notificationSessionExpiresAt, expiresAt);
	});
}

test('inbox: newest 50 retain service order and omit internal recipient/dedupe fields', async () => {
	for (let n = 1; n <= 52; n++) seed(seeker.id, n);
	const inbox = await inboxLoad(event() as never);
	assert.equal(inbox.notifications?.length, 50);
	assert.equal(inbox.notifications?.[0].id, id(52));
	assert.equal(inbox.notifications?.at(-1)?.id, id(3));
	assert.deepEqual(Object.keys(inbox.notifications![0]).sort(), ['createdAt', 'id', 'link', 'message', 'readAt', 'title']);
	assert.equal((await layoutLoad(event() as never)).notificationUnreadCount, 52);
});

test('inbox: empty list and zero count are successful results', async () => {
	assert.deepEqual((await inboxLoad(event() as never)).notifications, []);
	assert.equal((await layoutLoad(event() as never)).notificationUnreadCount, 0);
});

test('inbox: unsafe links are removed while notification text remains readable', async () => {
	seed(seeker.id, 1, 'javascript:alert(1)');
	const result = await inboxLoad(event() as never);
	assert.equal(result.notifications![0].link, null);
	assert.equal(result.notifications![0].message, 'Message 1');
});

test('inbox: owned mark-read is idempotent and reloaded list/count reflect the write', async () => {
	seed(seeker.id, 1);
	seed(recruiter.id, 2);
	assert.deepEqual(await mark(id(1)), { success: 'Notification marked as read.' });
	const firstRead = rows[0].readAt;
	assert.deepEqual(await mark(id(1)), { success: 'Notification marked as read.' });
	assert.strictEqual(rows[0].readAt, firstRead);
	assert.equal(rows[1].readAt, null);
	assert.deepEqual(calls.mark, [[seeker, id(1)], [seeker, id(1)]]);
	assert.equal((await layoutLoad(event() as never)).notificationUnreadCount, 0);
	assert.strictEqual((await inboxLoad(event() as never)).notifications![0].readAt, firstRead);
});

test('inbox: foreign, missing and malformed IDs share a generic failure', async () => {
	seed(recruiter.id, 1);
	for (const value of [id(1), id(99), 'malformed', '', null, new Blob(['not an ID'])]) {
		assert.deepEqual(await mark(value), fail(404, { message: 'Notification not found.' }));
	}
	assert.equal(calls.storageMark, 2);
	assert.equal(rows[0].readAt, null);
});

test('inbox: guests redirect before notification or profile access', async () => {
	for (const operation of [
		() => layoutLoad(event(null) as never),
		() => inboxLoad(event(null) as never),
		() => mark(id(1), null)
	]) {
		await assert.rejects(async () => operation(), (error) => isRedirect(error) && error.status === 303 && error.location === '/login');
	}
	assert.deepEqual(calls, { list: [], count: [], mark: [], profile: 0, storageMark: 0 });
});

test('inbox: real authentication hook redirects expired sessions and unverified accounts', async () => {
	const visit = async () => handle({ event: {
		url: new URL('http://localhost/notifications'), request: new Request('http://localhost/notifications'), locals: {}
	}, resolve: async () => new Response('ok') } as never);
	authSession = null; // Better Auth returns no session once it expires.
	await assert.rejects(visit, (error) => isRedirect(error) && error.location === '/login');
	authSession = { session: { expiresAt }, user: { ...seeker, emailVerified: false } };
	await assert.rejects(visit, (error) => isRedirect(error) && error.location.startsWith('/verify-email?'));
	authSession = { session: { expiresAt }, user: seeker };
	assert.equal((await visit()).status, 200);
	assert.equal(calls.list.length, 0);
});

test('inbox: account changes use fresh server results and never reuse another recipient list', async () => {
	seed(seeker.id, 1);
	const previous = await inboxLoad(event(seeker) as never);
	const current = await inboxLoad(event(recruiter) as never);
	assert.equal(previous.notificationOwnerId, seeker.id);
	assert.equal(current.notificationOwnerId, recruiter.id);
	assert.deepEqual(current.notifications, []);
});

test('inbox: refresh failure returns unavailable data rather than a previous list or false zero', async (t) => {
	const logs = captureErrors(t);
	seed(seeker.id, 1);
	assert.equal((await inboxLoad(event() as never)).notifications?.length, 1);
	serviceError = new Error('Sensitive database details');
	const inbox = await inboxLoad(event() as never);
	const layout = await layoutLoad(event() as never);
	assert.equal(inbox.notifications, null);
	assert.equal(layout.notificationUnreadCount, null);
	assert.equal(inbox.notificationLoadError, 'Notifications are unavailable. Please try refreshing.');
	assert.ok(!JSON.stringify([inbox, logs]).includes('Sensitive'));
});

test('inbox: action failures are generic and authentication redirects are never swallowed', async (t) => {
	const logs = captureErrors(t);
	serviceError = new Error('Private database error');
	assert.deepEqual(await mark(id(1)), fail(500, { message: 'The notification could not be marked as read. Please try again.' }));
	assert.ok(!JSON.stringify(logs).includes('Private'));
	try { redirect(303, '/login'); } catch (error) { serviceError = error; }
	for (const operation of [() => inboxLoad(event() as never), () => layoutLoad(event() as never), () => mark(id(1))]) {
		await assert.rejects(async () => operation(), (error) => isRedirect(error) && error.location === '/login');
	}
});
