import { and, desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { jobPosting } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';
import { parseJobSearch } from '$lib/server/job-search';

export const load: PageServerLoad = async ({ url, locals }) => {
	// /jobs?mine shows a recruiter only the postings they created; job seekers always get the full list
	const mine = locals.user!.role === 'recruiter' && url.searchParams.has('mine');
	const search = parseJobSearch(url.searchParams);
	const conditions: (SQL | undefined)[] = [
		mine ? eq(jobPosting.createdBy, locals.user!.id) : or(eq(jobPosting.published, true), eq(jobPosting.createdBy, locals.user!.id))
	];
	if (search.keyword) conditions.push(or(ilike(jobPosting.title, `%${search.keyword}%`), ilike(jobPosting.description, `%${search.keyword}%`)));
	if (search.company) conditions.push(ilike(jobPosting.company, `%${search.company}%`));
	if (search.location) conditions.push(ilike(jobPosting.location, `%${search.location}%`));
	if (search.employmentType) conditions.push(eq(jobPosting.employmentType, search.employmentType));
	if (search.workMode) conditions.push(eq(jobPosting.workMode, search.workMode));
	const postings = await db
		.select()
		.from(jobPosting)
		.where(and(...conditions))
		.orderBy(desc(jobPosting.createdAt));
	return { postings, mine, search };
};