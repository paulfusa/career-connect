import type { Notification } from './db/schema.ts';

export type AuthenticatedUser = { id: string };

export type CreateNotificationInput = {
	userId: string;
	type: string;
	title: string;
	message: string;
	link?: string | null;
	dedupeKey?: string | null;
};

type NotificationInsert = Pick<
	Notification,
	'userId' | 'type' | 'title' | 'message' | 'link' | 'dedupeKey'
>;

// Persistence implementations must scope reads/updates to userId, order lists by
// createdAt DESC then id DESC, and enforce deduplication atomically on insert.
export interface NotificationStore {
	insert(input: NotificationInsert): Promise<Notification | null>;
	list(userId: string, limit: number): Promise<Notification[]>;
	countUnread(userId: string): Promise<number>;
	markRead(notificationId: string, userId: string): Promise<boolean>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function requiredText(value: string, field: string): void {
	if (typeof value !== 'string' || !value.trim()) {
		throw new TypeError(`${field} is required`);
	}
}

function authenticatedId(user: AuthenticatedUser | undefined): string {
	if (!user || typeof user.id !== 'string' || !user.id.trim()) {
		throw new Error('Authentication required');
	}
	return user.id;
}

export function createNotificationService(store: NotificationStore) {
	return {
		/**
		 * Internal API for trusted server-side callers only. The recipient must be
		 * selected by trusted application logic, never arbitrary client input.
		 * Do not expose this method through a public recipient-selecting endpoint.
		 * Returns null for a globally duplicated dedupeKey without reading its owner.
		 */
		async createNotification(input: CreateNotificationInput): Promise<Notification | null> {
			requiredText(input.userId, 'userId');
			requiredText(input.type, 'type');
			requiredText(input.title, 'title');
			requiredText(input.message, 'message');
			if (input.dedupeKey != null) requiredText(input.dedupeKey, 'dedupeKey');
			if (input.link != null && (
				typeof input.link !== 'string' ||
				!input.link.startsWith('/') ||
				input.link.startsWith('//') ||
				/[\\\u0000-\u001f\u007f]/.test(input.link)
			)) {
				throw new TypeError('link must be a root-relative in-app path');
			}

			// Whitelist fields: callers cannot override generated IDs, dates or readAt.
			return store.insert({
				userId: input.userId,
				type: input.type,
				title: input.title,
				message: input.message,
				link: input.link ?? null,
				dedupeKey: input.dedupeKey ?? null
			});
		},

		// Callers must pass the authenticated locals.user, never a request-supplied ID.
		async getNotifications(user: AuthenticatedUser | undefined, limit = 50): Promise<Notification[]> {
			const userId = authenticatedId(user);
			if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
				throw new RangeError('limit must be an integer between 1 and 100');
			}
			return store.list(userId, limit);
		},

		async countUnreadNotifications(user: AuthenticatedUser | undefined): Promise<number> {
			return store.countUnread(authenticatedId(user));
		},

		async markNotificationAsRead(
			user: AuthenticatedUser | undefined,
			notificationId: string
		): Promise<boolean> {
			const userId = authenticatedId(user);
			if (!UUID.test(notificationId)) return false;
			return store.markRead(notificationId, userId);
		}
	};
}
