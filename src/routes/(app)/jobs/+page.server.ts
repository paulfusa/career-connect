import { desc } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { jobPosting } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({
	postings: await db.select().from(jobPosting).orderBy(desc(jobPosting.createdAt))
});
