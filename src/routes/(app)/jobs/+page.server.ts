import { and, asc, desc, eq, getTableColumns, gte, ilike, isNull, or, sql, type SQL } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { follow, jobPosting, user } from '$lib/server/db/schema';
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

	// US-28: only jobs whose minimum salary is at least what you typed (no minimum salary = hidden)
	if (search.minSalary) conditions.push(gte(jobPosting.salaryMin, Number(search.minSalary)));

	const after = postedAfter(search.postedWithin, new Date());
	if (after) conditions.push(gte(jobPosting.createdAt, after));

	// open only is the opposite of isClosed: status is open, and there's no deadline or it hasn't passed yet
	if (search.openOnly) conditions.push(and(eq(jobPosting.status, 'open'), or(isNull(jobPosting.applicationDeadline), gte(jobPosting.applicationDeadline, today))));

	// US-19: only jobs posted by people you follow
	if (search.following) {
		conditions.push(sql`${jobPosting.createdBy} in (select ${follow.followingId} from ${follow} where ${follow.followerId} = ${locals.user!.id})`);
	}

	// sorting (if two jobs tie, the newest one still comes first)
	let sortBy: SQL[] = [];
	if (search.sort === 'deadline') {
		// upcoming deadlines first, then the ones that passed, then jobs with no deadline
		sortBy = [sql`${jobPosting.applicationDeadline} < ${today}`, asc(jobPosting.applicationDeadline)];
	} else if (search.sort === 'salary') {
		// highest salary first, jobs with no salary at the end
		sortBy = [sql`coalesce(${jobPosting.salaryMax}, ${jobPosting.salaryMin}) desc nulls last`];
	}

	const postings = await db
		// US-19: also get the name and photo of the recruiter who posted each job
		.select({ ...getTableColumns(jobPosting), creatorName: user.name, creatorImage: user.image })
		.from(jobPosting)
		.innerJoin(user, eq(user.id, jobPosting.createdBy))
		.where(and(...conditions))
		.orderBy(...sortBy, desc(jobPosting.createdAt));
	// US-05: past-deadline jobs show as Closed too
	return { postings: postings.map((posting) => ({ ...posting, closed: isClosed(posting, today) })), mine, search };
};