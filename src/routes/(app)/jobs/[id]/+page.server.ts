import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { jobPosting, user } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!UUID.test(params.id)) error(404, 'Job posting not found.');

	const [result] = await db
		.select({ posting: jobPosting, creatorName: user.name })
		.from(jobPosting)
		.innerJoin(user, eq(jobPosting.createdBy, user.id))
		.where(eq(jobPosting.id, params.id));

	if (!result) error(404, 'Job posting not found.');
	return {
		...result,
		isOwner: result.posting.createdBy === locals.user!.id
	};
};
