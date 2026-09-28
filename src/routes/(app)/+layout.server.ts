import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { profile } from '$lib/server/db/schema';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// hooks.server.ts already redirects guests, so user is set here
	const user = locals.user!;
	const [row] = await db.select().from(profile).where(eq(profile.userId, user.id));
	return { user, profile: row ?? null };
};
