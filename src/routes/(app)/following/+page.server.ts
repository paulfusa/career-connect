import { fail } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { follow, profile, user } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

// US-19: the people you follow, the newest follow first
export const load: PageServerLoad = async ({ locals }) => {
	const following = await db
		.select({
			id: user.id,
			name: user.name,
			role: user.role,
			headline: profile.headline,
			jobTitle: profile.jobTitle,
			company: profile.company,
			since: follow.createdAt
		})
		.from(follow)
		.innerJoin(user, eq(follow.followingId, user.id))
		.leftJoin(profile, eq(profile.userId, user.id))
		.where(eq(follow.followerId, locals.user!.id))
		.orderBy(desc(follow.createdAt));

	return { following };
};

export const actions: Actions = {
	// only ever removes your own follow
	unfollow: async ({ request, locals }) => {
		const userId = (await request.formData()).get('userId');
		if (typeof userId !== 'string' || !userId) return fail(400, { message: 'User not found.' });

		await db.delete(follow).where(and(eq(follow.followerId, locals.user!.id), eq(follow.followingId, userId)));
		return { success: 'You no longer follow this person.' };
	}
};
