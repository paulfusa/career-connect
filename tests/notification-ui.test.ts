import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { registerHooks } from 'node:module';
import { compile } from 'svelte/compiler';
import { render } from 'svelte/server';
import { createRawSnippet } from 'svelte';
import { formatNotificationTime, notificationContextIsCurrent, safeNotificationLink, type NotificationItem } from '../src/lib/notification-ui.ts';

// Compile the real components for SSR using installed Svelte, without starting
// SvelteKit or importing the application's database/authentication clients.
registerHooks({
	resolve(specifier, context, next) {
		if (specifier.startsWith('$app/')) return { url: `fake:notification-ui:${specifier}`, shortCircuit: true };
		if (specifier.startsWith('$lib/')) {
			const path = specifier.slice(5);
			return { url: new URL(`../src/lib/${path}${/\.(svelte|ts)$/.test(path) ? '' : '.ts'}`, import.meta.url).href, shortCircuit: true };
		}
		return next(specifier, context);
	},
	load(url, context, next) {
		const fakes: Record<string, string> = {
			'fake:notification-ui:$app/forms': 'export const enhance = () => ({ destroy() {} });',
			'fake:notification-ui:$app/navigation': 'export const invalidate = async () => {};',
			'fake:notification-ui:$app/state': 'export const page = { url: new URL("http://localhost/notifications") };'
		};
		if (url in fakes) return { format: 'module', source: fakes[url], shortCircuit: true };
		if (url.endsWith('.svelte')) {
			const filename = fileURLToPath(url);
			return { format: 'module', source: compile(readFileSync(filename, 'utf8'), { filename, generate: 'server', css: 'external' }).js.code, shortCircuit: true };
		}
		return next(url, context);
	}
});

const Bell = (await import('../src/lib/components/NotificationBell.svelte')).default;
const Inbox = (await import('../src/routes/(app)/notifications/+page.svelte')).default;
const Layout = (await import('../src/routes/(app)/+layout.svelte')).default;
const jobId = '11111111-1111-4111-8111-111111111111';
const notificationId = '22222222-2222-4222-8222-222222222222';
const createdAt = new Date('2026-11-12T17:30:00Z');
const expiresAt = new Date('2099-01-01T00:00:00Z');
const user = { id: 'seeker-1', name: 'Ada', role: 'job_seeker', image: null };
const item: NotificationItem = { id: notificationId, title: 'Application update', message: 'Your application is under review.',
	createdAt, readAt: null, link: '/applications' };

function data(overrides: Record<string, unknown> = {}) {
	return { user, profile: null, notificationOwnerId: user.id, notificationUnreadCount: 1,
		notificationSessionExpiresAt: expiresAt, notificationLoadError: null, notifications: [item], ...overrides };
}
function inbox(overrides: Record<string, unknown> = {}, form: unknown = null) {
	return render(Inbox, { props: { data: data(overrides) as never, form: form as never, params: {} } }).body;
}

test('notification links: supports all current destinations and preserves safe query/fragment', () => {
	for (const path of ['/applications', '/applications/?status=interview#latest', `/jobs/${jobId}/applications`]) {
		assert.equal(safeNotificationLink(path), path.replace('/applications/?', '/applications?'));
	}
});

test('notification links: rejects missing, malformed, external, unsafe and unsupported destinations', () => {
	for (const value of [null, undefined, '', 123, 'applications', '//evil.invalid', 'https://evil.invalid/applications',
		'javascript:alert(1)', '/\\evil.invalid', '/applications\n', '/applications\u0000', '/applications\u007f',
		'/logout', '/api/auth/sign-out', '/unknown', '/jobs/not-a-uuid/applications', '/jobs/%2f%2fevil.invalid/applications']) {
		assert.equal(safeNotificationLink(value), null);
	}
});

test('notification context: account mismatch, missing identity and known expiry never permit display', () => {
	assert.equal(notificationContextIsCurrent(user.id, user.id, expiresAt, createdAt.getTime()), true);
	assert.equal(notificationContextIsCurrent(user.id, 'other-account', expiresAt), false);
	assert.equal(notificationContextIsCurrent('', '', null), false);
	assert.equal(notificationContextIsCurrent(user.id, user.id, createdAt, createdAt.getTime()), false);
	assert.equal(notificationContextIsCurrent(user.id, user.id, new Date(NaN)), false);
});

test('notification time: uses Toronto rather than the machine timezone', () => {
	const label = formatNotificationTime(createdAt);
	assert.match(label, /ET$/);
	assert.match(label, /12:30/);
});

test('notification bell: zero, unread, capped and unavailable badges have semantic labels', () => {
	for (const count of [0, 3, 123, null]) {
		const html = render(Bell, { props: { unreadCount: count, current: true } }).body;
		assert.match(html, /href="\/notifications"/);
		assert.match(html, /data-sveltekit-reload/);
		assert.match(html, /aria-current="page"/);
		assert.match(html, /aria-hidden="true"/);
		assert.match(html, /min-h-11/);
		assert.ok(html.includes(count === null ? 'unread count unavailable' : `${count} unread`));
		if (count === 123) assert.ok(html.includes('99+'));
		if (count === 0) assert.ok(!html.includes('rounded-full'));
		if (count === null) assert.ok(!html.includes('0 unread'));
	}
});

test('notification inbox: readable rows include native forms, timestamps, status and history limitation', () => {
	const html = inbox();
	assert.ok(html.includes('Showing the latest 50 notifications. Older notifications are not yet accessible.'));
	assert.ok(html.includes('including older notifications'));
	assert.match(html, /<h1[^>]*>Notifications<\/h1>/);
	assert.match(html, /<ul/);
	assert.match(html, /<time datetime="2026-11-12T17:30:00.000Z"/);
	assert.ok(html.includes('Unread'));
	assert.ok(html.includes('Mark as read: Application update'));
	assert.match(html, /method="post" action="\?\/markRead"/);
	assert.match(html, /name="notificationId"/);
	assert.doesNotMatch(html, /name="userId"|name="recipientId"/);
	assert.match(html, /method="get" action="\/notifications"/);
	assert.ok(html.includes('View related page'));
});

test('notification inbox: read presentation and refreshed count do not expose a second mark button', () => {
	const html = inbox({ notifications: [{ ...item, readAt: createdAt }], notificationUnreadCount: 0 });
	assert.ok(html.includes('0 unread in total'));
	assert.ok(html.includes('Read'));
	assert.doesNotMatch(html, /name="notificationId"/);
});

test('notification inbox: malicious content stays plain text and invalid links stay readable', () => {
	const title = '<script>alert("title")</script>';
	const message = '<img src=x onerror=alert("message")> & text';
	const html = inbox({ notifications: [{ ...item, title, message, link: 'javascript:alert(1)' }] });
	assert.match(html, /&lt;script(?:>|&gt;)/);
	assert.ok(html.includes('&lt;img'));
	assert.doesNotMatch(html, /<script|<img|href="javascript:/);
	assert.ok(!html.includes('View related page'));
	assert.ok(html.includes('Mark as read'));
});

test('notification inbox: successful empty state differs from load failure and count unavailability', () => {
	assert.ok(inbox({ notifications: [] }).includes('No notifications yet.'));
	const html = inbox({ notifications: null, notificationLoadError: 'Notifications are unavailable. Please try refreshing.', notificationUnreadCount: null });
	assert.ok(html.includes('Notifications are unavailable.'));
	assert.ok(html.includes('Unread count unavailable.'));
	assert.ok(!html.includes('No notifications yet.'));
	assert.ok(!html.includes(item.message));
});

test('notification inbox: changing identity or expiring a session suppresses previously supplied rows', () => {
	assert.ok(inbox().includes(item.message));
	for (const overrides of [{ user: { ...user, id: 'other-account' } }, { notificationSessionExpiresAt: new Date('2000-01-01') }]) {
		const html = inbox(overrides);
		assert.ok(!html.includes(item.message));
		assert.ok(!html.includes('1 unread in total'));
		assert.ok(html.includes('Sign in again'));
	}
	assert.ok(!inbox({ notifications: null }).includes(item.message));
});

test('notification inbox: action failures are accessible without exposing internal errors', () => {
	const html = inbox({}, { message: 'Notification not found.' });
	assert.match(html, /role="alert"/);
	assert.ok(html.includes('Notification not found.'));
	assert.ok(html.includes(item.message));
});

test('notification layout: both role navigations retain logout and expose the bell with mobile wrapping', () => {
	const children = createRawSnippet(() => ({ render: () => '<p>INBOX_CHILD</p>' }));
	for (const role of ['job_seeker', 'recruiter']) {
		const html = render(Layout, { props: { data: data({ user: { ...user, role } }) as never, children, params: {} } }).body;
		assert.ok(html.includes('Main navigation'));
		assert.ok(html.includes('flex-wrap'));
		assert.ok(html.includes('Notifications'));
		assert.ok(html.includes('action="/logout"'));
		assert.ok(html.includes('INBOX_CHILD'));
		assert.equal(html.includes('My Applications'), role === 'job_seeker');
	}
	const html = render(Layout, { props: { data: data({ notificationSessionExpiresAt: new Date('2000-01-01') }) as never, children, params: {} } }).body;
	assert.ok(!html.includes('INBOX_CHILD'));
});

test('notification enhancement: successful actions use one built-in update, while refresh invalidates one key', () => {
	const source = readFileSync(new URL('../src/routes/(app)/notifications/+page.svelte', import.meta.url), 'utf8');
	// Guard the supported API wiring in addition to actual server/component tests.
	assert.equal((source.match(/await invalidate\('app:notifications'\)/g) ?? []).length, 1);
	assert.doesNotMatch(source, /invalidateAll\(/);
	assert.match(source, /result.type === 'redirect'[\s\S]*?unavailable = true;[\s\S]*?await update\(\{ reset: false \}\);[\s\S]*?return;/);
	assert.match(source, /await update\(\{ reset: false \}\);\s*if \(result.type === 'failure'/);
	assert.doesNotMatch(source, /lastSuccessful|lastLoaded|localStorage|sessionStorage|\{@html/);
});
