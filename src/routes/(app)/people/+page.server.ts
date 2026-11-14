import { and, asc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { follow, profile, user } from '$lib/server/db/schema';
import { roleToFind } from '$lib/server/follow';
import type { PageServerLoad } from './$types';

const LIMIT = 50;

// US-19: job seekers can look through recruiters and recruiters through job seekers, to find people to follow
export const load: PageServerLoad = async ({ url, locals }) => {
	const me = locals.user!;
	const role = roleToFind(me.role);
	const search = (url.searchParams.get('q') ?? '').trim().slice(0, 100);
	if (!role) return { people: [], search, more: false };

	// only people who finished signing up (verified their email)
	const conditions: (SQL | undefined)[] = [eq(user.role, role), eq(user.emailVerified, true)];
	if (search) {
		conditions.push(
			or(
				ilike(user.name, `%${search}%`),
				ilike(profile.headline, `%${search}%`),
				ilike(profile.jobTitle, `%${search}%`),
				ilike(profile.company, `%${search}%`)
			)
		);
	}

	const people = await db
		.select({
			id: user.id,
			name: user.name,
			image: user.image,
			headline: profile.headline,
			jobTitle: profile.jobTitle,
			company: profile.company,
			location: profile.location,
			// filled in when you already follow them
			followingSince: follow.createdAt
		})
		.from(user)
		.leftJoin(profile, eq(profile.userId, user.id))
		.leftJoin(follow, and(eq(follow.followerId, me.id), eq(follow.followingId, user.id)))
		.where(and(...conditions))
		.orderBy(asc(user.name))
		.limit(LIMIT);

	return { people, search, more: people.length === LIMIT };
};
