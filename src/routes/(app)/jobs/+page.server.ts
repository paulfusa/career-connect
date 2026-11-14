import { and, asc, desc, eq, gte, ilike, isNull, or, sql, type SQL } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { jobPosting } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';
import { parseJobSearch, postedAfter } from '$lib/server/job-search';
import { isClosed } from '$lib/server/job-posting';
import { todayEastern } from '$lib/server/application';

export const load: PageServerLoad = async ({ url, locals }) => {
	// /jobs?mine shows a recruiter only the postings they created; job seekers always get the full list
	const mine = locals.user!.role === 'recruiter' && url.searchParams.has('mine');
	const search = parseJobSearch(url.searchParams);
	const today = todayEastern();
	const conditions: (SQL | undefined)[] = [
		mine ? eq(jobPosting.createdBy, locals.user!.id) : or(eq(jobPosting.published, true), eq(jobPosting.createdBy, locals.user!.id))
	];
	if (search.keyword) conditions.push(or(ilike(jobPosting.title, `%${search.keyword}%`), ilike(jobPosting.description, `%${search.keyword}%`)));
	if (search.company) conditions.push(ilike(jobPosting.company, `%${search.company}%`));
	if (search.location) conditions.push(ilike(jobPosting.location, `%${search.location}%`));
	if (search.employmentType) conditions.push(eq(jobPosting.employmentType, search.employmentType));
	if (search.workMode) conditions.push(eq(jobPosting.workMode, search.workMode));

	// US-28: the job's minimum salary has to be the same or higher than what you typed, jobs with no minimum salary drop out
	if (search.minSalary) conditions.push(gte(jobPosting.salaryMin, Number(search.minSalary)));

	const after = postedAfter(search.postedWithin, new Date());
	if (after) conditions.push(gte(jobPosting.createdAt, after));

	// open only is the opposite of isClosed: status is open, and there's no deadline or it hasn't passed yet
	if (search.openOnly) conditions.push(and(eq(jobPosting.status, 'open'), or(isNull(jobPosting.applicationDeadline), gte(jobPosting.applicationDeadline, today))));

	// what to sort by first, and if two jobs tie the newest comes first.
	// By deadline: upcoming ones first, then passed ones, then jobs with no deadline
	const sortBy =
		search.sort === 'deadline'
			? [sql`${jobPosting.applicationDeadline} < ${today}`, asc(jobPosting.applicationDeadline)]
			: search.sort === 'salary'
				? [sql`coalesce(${jobPosting.salaryMax}, ${jobPosting.salaryMin}) desc nulls last`]
				: [];

	const postings = await db
		.select()
		.from(jobPosting)
		.where(and(...conditions))
		.orderBy(...sortBy, desc(jobPosting.createdAt));
	// US-05: past-deadline jobs show as Closed too
	return { postings: postings.map((posting) => ({ ...posting, closed: isClosed(posting, today) })), mine, search };
};