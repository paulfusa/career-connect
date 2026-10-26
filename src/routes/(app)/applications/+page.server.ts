import { error } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { application, jobPosting } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const me = locals.user;
    if (!me || me.role !== 'job_seeker') error(403, 'Only job seekers can view My Applications.');

    const applications = await db.select({
        id: application.id,
        jobPostingId: jobPosting.id,
        title: jobPosting.title,
        company: jobPosting.company,
        appliedAt: application.createdAt,
        status: application.status
    })
        .from(application)
        .innerJoin(jobPosting, eq(application.jobPostingId, jobPosting.id))
        .where(eq(application.userId, me.id))
        .orderBy(desc(application.createdAt));

    return { applications };
};
