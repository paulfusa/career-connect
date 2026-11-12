import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Notification } from './db/schema.ts';
import {
	createNotificationService,
	type CreateNotificationInput,
	type NotificationStore
} from './notifications.ts';

const owner = { id: 'user-1', role: 'job_seeker' };
const other = { id: 'user-2', role: 'recruiter' };
const input: CreateNotificationInput = {
	userId: owner.id,
	type: 'application_update',
	title: 'Application updated',
	message: 'Your application has been reviewed.'
};
const now = new Date('2026-11-11T12:00:00Z');
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

// Models the store contract, not PostgreSQL. SQL predicates/conflicts still need
// adapter review and future database integration tests.
function fixture() {
	const rows: Notification[] = [];
	const calls = {
		insert: [] as Parameters<NotificationStore['insert']>[],
		list: [] as Parameters<NotificationStore['list']>[],
		countUnread: [] as Parameters<NotificationStore['countUnread']>[],
		markRead: [] as Parameters<NotificationStore['markRead']>[]
	};
	const store: NotificationStore = {
		async insert(values) {
			calls.insert.push([values]);
			if (values.dedupeKey !== null && rows.some((row) => row.dedupeKey === values.dedupeKey)) {
				return null;
			}
			const row: Notification = {
				...values,
				id: id(rows.length + 1),
				readAt: null,
				createdAt: new Date(now.getTime() + rows.length * 1000)
			};
			rows.push(row);
			return row;
		},
		async list(userId, limit) {
			calls.list.push([userId, limit]);
			return rows
				.filter((row) => row.userId === userId)
				.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id))
				.slice(0, limit);
		},
		async countUnread(userId) {
			calls.countUnread.push([userId]);
			return rows.filter((row) => row.userId === userId && row.readAt === null).length;
		},
		async markRead(notificationId, userId) {
			calls.markRead.push([notificationId, userId]);
			const row = rows.find((row) => row.id === notificationId && row.userId === userId);
			if (!row) return false;
			row.readAt ??= new Date(now);
			return true;
		}
	};
	return { service: createNotificationService(store), rows, calls };
}

test('notifications: creates a notification with nullable optional fields', async () => {
	const { service, calls } = fixture();
	const created = await service.createNotification(input);
	assert.ok(created);
	assert.deepEqual(calls.insert, [[{ ...input, link: null, dedupeKey: null }]]);
	assert.equal(created.userId, owner.id);
	assert.equal(created.readAt, null);
	assert.ok(created.createdAt instanceof Date);
});

test('notifications: preserves supplied optional fields and whitelists insert fields', async () => {
	const { service, calls } = fixture();
	const values = {
		...input,
		link: '/applications?status=reviewed#latest',
		dedupeKey: 'application:1:reviewed:user-1',
		id: id(99),
		readAt: now,
		createdAt: now
	};
	const created = await service.createNotification(values);
	assert.ok(created);
	assert.deepEqual(calls.insert, [[{
		...input, link: values.link, dedupeKey: values.dedupeKey
	}]]);
	assert.notEqual(created.id, values.id);
	assert.equal(created.readAt, null);
});

for (const field of ['userId', 'type', 'title', 'message', 'dedupeKey'] as const) {
	test(`notifications: rejects blank ${field} before inserting`, async () => {
		const { service, calls } = fixture();
		for (const value of ['', ' \t\n']) {
			await assert.rejects(service.createNotification({ ...input, [field]: value }), TypeError);
		}
		assert.deepEqual(calls.insert, []);
	});
}

test('notifications: permits root-relative paths and explicit null optional values', async () => {
	const { service } = fixture();
	for (const link of ['/', '/jobs/123', '/applications?status=reviewed#latest', null]) {
		assert.ok(await service.createNotification({ ...input, link, dedupeKey: null }));
	}
});

test('notifications: rejects unsafe or non-root-relative links before inserting', async () => {
	const { service, calls } = fixture();
	for (const link of [
		'', 'jobs/123', 'https://example.com', '//example.com', 'javascript:alert(1)',
		'/\\example.com', '/jobs\\123', '/jobs\n123', '/jobs\u0000123', '/jobs\u007f123'
	]) {
		await assert.rejects(service.createNotification({ ...input, link }), TypeError);
	}
	assert.deepEqual(calls.insert, []);
});

test('notifications: duplicate keys return null without changing or returning the original', async () => {
	const { service, rows, calls } = fixture();
	const first = await service.createNotification({ ...input, dedupeKey: 'event:1:user-1' });
	assert.ok(first);
	await service.markNotificationAsRead(owner, first.id);
	const snapshot = { ...first };
	assert.equal(await service.createNotification({
		...input, title: 'Changed', dedupeKey: 'event:1:user-1'
	}), null);
	assert.deepEqual(rows, [snapshot]);
	assert.equal(calls.insert.length, 2);
	assert.deepEqual(calls.list, []);
});

test('notifications: global duplicate keys do not disclose another recipient notification', async () => {
	const { service, rows } = fixture();
	assert.ok(await service.createNotification({ ...input, dedupeKey: 'global-event' }));
	assert.equal(await service.createNotification({
		...input, userId: other.id, dedupeKey: 'global-event'
	}), null);
	assert.equal(rows.length, 1);
	assert.equal(rows[0].userId, owner.id);
});

test('notifications: omitted and null dedupe keys allow repeated notifications', async () => {
	const { service, rows } = fixture();
	assert.ok(await service.createNotification(input));
	assert.ok(await service.createNotification(input));
	assert.ok(await service.createNotification({ ...input, dedupeKey: null }));
	assert.equal(rows.length, 3);
});

test('notifications: lists only the authenticated recipient, newest first with deterministic ties', async () => {
	const { service, rows, calls } = fixture();
	for (const userId of [owner.id, other.id, owner.id, owner.id]) {
		await service.createNotification({ ...input, userId });
	}
	rows[2].createdAt = rows[3].createdAt;
	const result = await service.getNotifications(owner);
	assert.deepEqual(result.map((row) => row.id), [id(4), id(3), id(1)]);
	assert.deepEqual(calls.list, [[owner.id, 50]]);
	assert.deepEqual((await service.getNotifications(other)).map((row) => row.id), [id(2)]);
	assert.deepEqual(calls.list[1], [other.id, 50]);
});

test('notifications: returns an empty list and zero count for an empty inbox', async () => {
	const { service } = fixture();
	assert.deepEqual(await service.getNotifications(owner), []);
	assert.equal(await service.countUnreadNotifications(owner), 0);
});

test('notifications: applies the default and explicit retrieval limits', async () => {
	const { service, calls } = fixture();
	for (let n = 0; n < 101; n++) await service.createNotification(input);
	assert.equal((await service.getNotifications(owner)).length, 50);
	assert.equal((await service.getNotifications(owner, 1)).length, 1);
	assert.equal((await service.getNotifications(owner, 100)).length, 100);
	assert.deepEqual(calls.list, [[owner.id, 50], [owner.id, 1], [owner.id, 100]]);
	assert.equal(await service.countUnreadNotifications(owner), 101);
});

test('notifications: rejects invalid limits before querying', async () => {
	const { service, calls } = fixture();
	for (const limit of [0, -1, 101, 1.5, NaN, Infinity]) {
		await assert.rejects(service.getNotifications(owner, limit), RangeError);
	}
	assert.deepEqual(calls.list, []);
});

test('notifications: unread counts exclude read rows and other recipients', async () => {
	const { service, calls } = fixture();
	const first = await service.createNotification(input);
	assert.ok(first);
	await service.createNotification(input);
	await service.createNotification({ ...input, userId: other.id });
	await service.markNotificationAsRead(owner, first.id);
	assert.equal(await service.countUnreadNotifications(owner), 1);
	assert.deepEqual(calls.countUnread, [[owner.id]]);
});

test('notifications: marks an owned notification read and preserves its first read timestamp', async () => {
	const { service, rows, calls } = fixture();
	const first = await service.createNotification(input);
	assert.ok(first);
	assert.equal(await service.markNotificationAsRead(owner, first.id), true);
	const readAt = rows[0].readAt;
	assert.ok(readAt instanceof Date);
	assert.equal(await service.markNotificationAsRead(owner, first.id), true);
	assert.strictEqual(rows[0].readAt, readAt);
	assert.deepEqual(calls.markRead, [[first.id, owner.id], [first.id, owner.id]]);
	assert.equal(await service.countUnreadNotifications(owner), 0);
});

test('notifications: foreign and missing IDs both return false without changing a row', async () => {
	const { service, rows, calls } = fixture();
	const first = await service.createNotification(input);
	assert.ok(first);
	assert.equal(await service.markNotificationAsRead(other, first.id), false);
	assert.equal(await service.markNotificationAsRead(other, id(99)), false);
	assert.equal(rows[0].readAt, null);
	assert.deepEqual(calls.markRead, [[first.id, other.id], [id(99), other.id]]);
});

test('notifications: malformed IDs return false without accessing storage', async () => {
	const { service, calls } = fixture();
	for (const notificationId of ['', 'not-a-uuid', `${id(1)} trailing`]) {
		assert.equal(await service.markNotificationAsRead(owner, notificationId), false);
	}
	assert.deepEqual(calls.markRead, []);
});

test('notifications: unauthenticated operations fail before accessing storage', async () => {
	const { service, calls } = fixture();
	for (const user of [undefined, { id: '' }, { id: ' \t' }]) {
		await assert.rejects(service.getNotifications(user), /^Error: Authentication required$/);
		await assert.rejects(service.countUnreadNotifications(user), /^Error: Authentication required$/);
		await assert.rejects(service.markNotificationAsRead(user, id(1)), /^Error: Authentication required$/);
	}
	assert.deepEqual(calls, { insert: [], list: [], countUnread: [], markRead: [] });
});

test('notifications: both seekers and recruiters can access their own notifications', async () => {
	const { service } = fixture();
	for (const user of [owner, other]) {
		const created = await service.createNotification({ ...input, userId: user.id });
		assert.ok(created);
		assert.equal((await service.getNotifications(user)).length, 1);
		assert.equal(await service.countUnreadNotifications(user), 1);
		assert.equal(await service.markNotificationAsRead(user, created.id), true);
	}
});

test('notifications: unexpected persistence errors propagate from every operation', async () => {
	const failure = new Error('Persistence unavailable');
	const reject = async (): Promise<never> => { throw failure; };
	const service = createNotificationService({
		insert: reject, list: reject, countUnread: reject, markRead: reject
	});
	for (const operation of [
		() => service.createNotification(input),
		() => service.getNotifications(owner),
		() => service.countUnreadNotifications(owner),
		() => service.markNotificationAsRead(owner, id(1))
	]) {
		await assert.rejects(operation, (error) => error === failure);
	}
});
