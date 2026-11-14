import { eq } from 'drizzle-orm';
import { isRedirect, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { profile } from '$lib/server/db/schema';
import { notificationService } from '$lib/server/notifications-db';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ locals, depends, setHeaders }) => {
	const user = locals.user;
	if (!user) redirect(303, '/login');
	depends('app:notifications');
	setHeaders({ 'cache-control': 'private, no-store' });
	const [rows, notificationUnreadCount] = await Promise.all([
		db.select().from(profile).where(eq(profile.userId, user.id)),
		notificationService.countUnreadNotifications(user).catch((error: unknown) => {
			if (isRedirect(error)) throw error;
			console.error('Notification count failed', { errorName: error instanceof Error ? error.name : 'UnknownError' });
			return null;
		})
	]);
	return {
		user, profile: rows[0] ?? null, notificationUnreadCount,
		notificationOwnerId: user.id,
		notificationSessionExpiresAt: locals.session?.expiresAt ?? null
	};
}) satisfies LayoutServerLoad;
