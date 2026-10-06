import { desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { jobPosting } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	// /jobs?mine shows a recruiter only the postings they created; job seekers always get the full list
	const mine = locals.user!.role === 'recruiter' && url.searchParams.has('mine');
	const postings = await db
		.select()
		.from(jobPosting)
		.where(mine ? eq(jobPosting.createdBy, locals.user!.id) : undefined)
		.orderBy(desc(jobPosting.createdAt));
	return { postings, mine };
};
