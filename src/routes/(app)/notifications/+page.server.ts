import { fail, isRedirect, redirect } from '@sveltejs/kit';
import { notificationService } from '$lib/server/notifications-db';
import { safeNotificationLink, type NotificationItem } from '$lib/notification-ui';
import type { Actions, PageServerLoad } from './$types';

export const load = (async ({ locals, depends }) => {
	const user = locals.user;
	if (!user) redirect(303, '/login');
	depends('app:notifications');
	const context = {
		notificationOwnerId: user.id,
		notificationSessionExpiresAt: locals.session?.expiresAt ?? null
	};
	try {
		const rows = await notificationService.getNotifications(user);
		const notifications: NotificationItem[] = rows.map(({ id, title, message, createdAt, readAt, link }) => ({
			id, title, message, createdAt, readAt, link: safeNotificationLink(link)
		}));
		return { ...context, notifications, notificationLoadError: null };
	} catch (error) {
		if (isRedirect(error)) throw error;
		console.error('Notification inbox load failed', { errorName: error instanceof Error ? error.name : 'UnknownError' });
		return { ...context, notifications: null, notificationLoadError: 'Notifications are unavailable. Please try refreshing.' };
	}
}) satisfies PageServerLoad;

export const actions: Actions = {
	markRead: async ({ locals, request }) => {
		const user = locals.user;
		if (!user) redirect(303, '/login');
		const value = (await request.formData()).get('notificationId');
		const id = typeof value === 'string' ? value : '';
		try {
			const marked = await notificationService.markNotificationAsRead(user, id);
			if (!marked) return fail(404, { message: 'Notification not found.' });
			return { success: 'Notification marked as read.' };
		} catch (error) {
			if (isRedirect(error)) throw error;
			console.error('Notification mark-read failed', { errorName: error instanceof Error ? error.name : 'UnknownError' });
			return fail(500, { message: 'The notification could not be marked as read. Please try again.' });
		}
	}
};
