import { error, fail, redirect } from '@sveltejs/kit';
import { and, count, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { follow, jobPosting, profile, user } from '$lib/server/db/schema';
import { canSeeProfile, followProblem } from '$lib/server/follow';
import { loadEntries } from '$lib/server/profile-data';
import type { Actions, PageServerLoad } from './$types';

// US-04: recruiters can see job seekers' profiles. US-19: job seekers can now see recruiters' too, so they can follow them
export const load: PageServerLoad = async ({ params, locals }) => {
	const me = locals.user!;
	if (params.id === me.id) redirect(303, '/profile');

	const [row] = await db
		.select({ name: user.name, email: user.email, image: user.image, role: user.role, profile })
		.from(user)
		.leftJoin(profile, eq(profile.userId, user.id))
		.where(eq(user.id, params.id));
	// same 404 for "not allowed" and "doesn't exist", so ids can't be probed
	if (!row || !canSeeProfile(me.role, row.role)) error(404, 'Profile not found');

	const entries = await loadEntries(params.id);
	const [followers] = await db.select({ count: count() }).from(follow).where(eq(follow.followingId, params.id));
	// do I already follow them?
	const [mine] = await db
		.select({ id: follow.id })
		.from(follow)
		.where(and(eq(follow.followerId, me.id), eq(follow.followingId, params.id)));

	// a recruiter's latest published jobs, so their followers can see what they post
	const jobs =
		row.role === 'recruiter'
			? await db
					.select({ id: jobPosting.id, title: jobPosting.title, location: jobPosting.location, createdAt: jobPosting.createdAt })
					.from(jobPosting)
					.where(and(eq(jobPosting.createdBy, params.id), eq(jobPosting.published, true)))
					.orderBy(desc(jobPosting.createdAt))
					.limit(5)
			: [];

	const { profile: target, ...account } = row;
	return { target: account, targetProfile: target, ...entries, followers: followers.count, following: !!mine, jobs };
};

export const actions: Actions = {
	follow: async ({ params, locals }) => {
		const me = locals.user!;
		const [target] = await db.select({ id: user.id, role: user.role }).from(user).where(eq(user.id, params.id));
		const problem = followProblem(me, target);
		if (problem) return fail(400, { message: problem });

		// the unique pair stops a double click from following twice
		const [added] = await db
			.insert(follow)
			.values({ followerId: me.id, followingId: params.id })
			.onConflictDoNothing({ target: [follow.followerId, follow.followingId] })
			.returning({ id: follow.id });
		if (!added) return fail(400, { message: 'You already follow this person.' });
		return { success: 'You now follow this person.' };
	},

	// only ever removes your own follow
	unfollow: async ({ params, locals }) => {
		await db.delete(follow).where(and(eq(follow.followerId, locals.user!.id), eq(follow.followingId, params.id)));
		return { success: 'You no longer follow this person.' };
	}
};
