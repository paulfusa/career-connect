import type { Notification } from './server/db/schema.ts';

export type NotificationItem = Pick<Notification, 'id' | 'title' | 'message' | 'createdAt' | 'readAt'> & {
	link: string | null;
};

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const JOB_APPLICATIONS = new RegExp(`^/jobs/${UUID}/applications/?$`, 'i');
const LINK_ORIGIN = 'https://notification.invalid';

// Support current producer destinations only. Destination routes still authorize
// the request; this helper cannot determine whether a posting still exists.
export function safeNotificationLink(value: unknown): string | null {
	if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(value)) return null;
	try {
		const url = new URL(value, LINK_ORIGIN);
		if (url.origin !== LINK_ORIGIN || !(/^\/applications\/?$/.test(url.pathname) || JOB_APPLICATIONS.test(url.pathname))) return null;
		return `${url.pathname.replace(/\/$/, '')}${url.search}${url.hash}`;
	} catch {
		return null;
	}
}

export function formatNotificationTime(date: Date): string {
	return `${new Intl.DateTimeFormat('en-CA', {
		dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Toronto'
	}).format(date)} ET`;
}

// No notification cache: these checks also guard temporarily mismatched parent
// and page data during account changes and known session expiry.
export function notificationContextIsCurrent(
	ownerId: string, userId: string, expiresAt: Date | null, now = Date.now()
): boolean {
	return !!ownerId && ownerId === userId && (expiresAt === null || expiresAt.getTime() > now);
}
