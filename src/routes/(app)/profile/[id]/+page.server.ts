import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { profile, user } from '$lib/server/db/schema';
import { loadEntries } from '$lib/server/profile-data';
import type { PageServerLoad } from './$types';

// US-04: recruiters can view job seekers' profiles; everyone else only has their own /profile.
export const load: PageServerLoad = async ({ params, locals }) => {
	const me = locals.user!;
	if (params.id === me.id) redirect(303, '/profile');
	// same 404 for "not allowed" and "doesn't exist", so ids can't be probed
	if (me.role !== 'recruiter') error(404, 'Profile not found');

	const [row] = await db
		.select({ name: user.name, email: user.email, image: user.image, role: user.role, profile })
		.from(user)
		.leftJoin(profile, eq(profile.userId, user.id))
		.where(eq(user.id, params.id));
	if (!row || row.role !== 'job_seeker') error(404, 'Profile not found');

	const { profile: target, ...account } = row;
	return { target: account, targetProfile: target, ...(await loadEntries(params.id)) };
};
