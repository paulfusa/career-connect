import { and, count, desc, eq, isNull, sql } from 'drizzle-orm';
import { db } from './db';
import { notification } from './db/schema';
import { createNotificationService, type NotificationStore } from './notifications.ts';

// Keep SQL ownership restrictions here, even though the service also authenticates.
const notificationStore: NotificationStore = {
	async insert(input) {
		const [created] = await db
			.insert(notification)
			.values({
				userId: input.userId,
				type: input.type,
				title: input.title,
				message: input.message,
				link: input.link,
				dedupeKey: input.dedupeKey
			})
			.onConflictDoNothing({ target: notification.dedupeKey })
			.returning();
		return created ?? null;
	},

	async list(userId, limit) {
		return db
			.select()
			.from(notification)
			.where(eq(notification.userId, userId))
			.orderBy(desc(notification.createdAt), desc(notification.id))
			.limit(limit);
	},

	async countUnread(userId) {
		const [{ total }] = await db
			.select({ total: count() })
			.from(notification)
			.where(and(eq(notification.userId, userId), isNull(notification.readAt)));
		return total;
	},

	async markRead(notificationId, userId) {
		const [updated] = await db
			.update(notification)
			.set({ readAt: sql`coalesce(${notification.readAt}, now())` })
			.where(and(eq(notification.id, notificationId), eq(notification.userId, userId)))
			.returning({ id: notification.id });
		return updated !== undefined;
	}
};

// Internal server service; no public endpoint is registered by this module.
export const notificationService = createNotificationService(notificationStore);
