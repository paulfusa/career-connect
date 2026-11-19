import { fail, redirect } from '@sveltejs/kit';
import { and, asc, count, desc, eq, getTableColumns, gte, ilike, inArray, isNull, or, sql, type SQL } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { application, companyProfile, companyReview, follow, jobPosting, user } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';
import { parseJobSearch, postedAfter } from '$lib/server/job-search';
import { toRating } from '$lib/server/company-reviews';
import { isClosed } from '$lib/server/job-posting';
import { todayEastern } from '$lib/server/application';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const load: PageServerLoad = async ({ url, locals }) => {
	// /jobs?mine shows a recruiter only the postings they created; job seekers always get the full list
	const mine = locals.user!.role === 'recruiter' && url.searchParams.has('mine');
	const archivedView = mine && url.searchParams.get('archived') === '1';
	const search = parseJobSearch(url.searchParams);
	const today = todayEastern();
	const conditions: (SQL | undefined)[] = [
		mine
			? and(eq(jobPosting.createdBy, locals.user!.id), eq(jobPosting.archived, archivedView))
			: and(
					eq(jobPosting.archived, false),
					or(eq(jobPosting.published, true), eq(jobPosting.createdBy, locals.user!.id))
				)
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

	// US-09: reviews of the company of whoever posted the job
	const companyReviews = sql`from ${companyReview} inner join ${companyProfile} on ${companyProfile.id} = ${companyReview.companyId}
		where ${companyProfile.recruiterId} = ${jobPosting.createdBy}`;

	const postings = await db
		// US-19: also get the name and photo of the recruiter who posted each job
		.select({
			...getTableColumns(jobPosting),
			creatorName: user.name,
			creatorImage: user.image,
			ratingAverage: sql<string | null>`(select avg(${companyReview.rating}) ${companyReviews})`,
			ratingCount: sql<number>`(select count(*)::int ${companyReviews})`
		})
		.from(jobPosting)
		.innerJoin(user, eq(user.id, jobPosting.createdBy))
		.where(and(...conditions))
		.orderBy(...sortBy, desc(jobPosting.createdAt));
	const applicationCounts = mine && postings.length
		? await db
				.select({ jobPostingId: application.jobPostingId, total: count() })
				.from(application)
				.where(inArray(application.jobPostingId, postings.map((posting) => posting.id)))
				.groupBy(application.jobPostingId)
		: [];
	const countsByPosting = new Map(applicationCounts.map(({ jobPostingId, total }) => [jobPostingId, total]));

	// US-05: past-deadline jobs show as Closed too
	return {
		postings: postings.map(({ ratingAverage, ratingCount, ...posting }) => ({
			...posting,
			closed: isClosed(posting, today),
			applicationCount: mine ? countsByPosting.get(posting.id) ?? 0 : null,
			rating: toRating(ratingAverage, ratingCount)
		})),
		mine,
		archivedView,
		search
	};
};

export const actions: Actions = {
	archive: async ({ request, locals }) => {
		const me = locals.user!;
		if (me.role !== 'recruiter') return fail(403, { message: 'Only recruiters can archive job postings.' });

		const id = (await request.formData()).get('id')?.toString() ?? '';
		if (!UUID.test(id)) return fail(400, { message: 'Invalid job posting.' });

		const [posting] = await db
			.update(jobPosting)
			.set({ archived: true, updatedAt: new Date() })
			.where(and(eq(jobPosting.id, id), eq(jobPosting.createdBy, me.id)))
			.returning({ id: jobPosting.id });
		if (!posting) return fail(404, { message: 'Job posting not found.' });
		redirect(303, '/jobs?mine&archived=1');
	},
	unarchive: async ({ request, locals }) => {
		const me = locals.user!;
		if (me.role !== 'recruiter') return fail(403, { message: 'Only recruiters can unarchive job postings.' });

		const id = (await request.formData()).get('id')?.toString() ?? '';
		if (!UUID.test(id)) return fail(400, { message: 'Invalid job posting.' });

		const [posting] = await db
			.update(jobPosting)
			.set({ archived: false, updatedAt: new Date() })
			.where(and(eq(jobPosting.id, id), eq(jobPosting.createdBy, me.id)))
			.returning({ id: jobPosting.id });
		if (!posting) return fail(404, { message: 'Job posting not found.' });
		redirect(303, '/jobs?mine');
	}
};