
import { error } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { application, jobPosting } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

const allowedStatuses = ['applied', 'under_review', 'interview', 'offered', 'rejected'] as const;

export const load: PageServerLoad = async ({ locals, url }) => {
	const me = locals.user;

	if (!me || me.role !== 'job_seeker') {
		error(403, 'Only job seekers can view My Applications.');
	}

	const requestedStatus = url.searchParams.get('status');

	const status =
		requestedStatus && allowedStatuses.some((value) => value === requestedStatus)
			? requestedStatus
			: null;

	const conditions = [
		eq(application.userId, me.id),
		...(status
			? [eq(application.status, status as (typeof allowedStatuses)[number])]
			: [])
	];

	const applications = await db
		.select({
			id: application.id,
			jobPostingId: jobPosting.id,
			title: jobPosting.title,
			company: jobPosting.company,
			appliedAt: application.createdAt,
			status: application.status
		})
		.from(application)
		.innerJoin(jobPosting, eq(application.jobPostingId, jobPosting.id))
		.where(and(...conditions))
		.orderBy(desc(application.createdAt));

	return { applications, status };
};
