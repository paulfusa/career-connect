
import { error } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { application, jobPosting, resume, user } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const load: PageServerLoad = async ({ params, locals }) => {
    const me = locals.user!;

    if (me.role !== 'recruiter' || !UUID.test(params.id)) {
        error(404, 'Job posting not found.');
    }

    // A recruiter can only view applications for their own job.
    const [posting] = await db
        .select({
            id: jobPosting.id,
            title: jobPosting.title,
            company: jobPosting.company
        })
        .from(jobPosting)
        .where(
            and(
                eq(jobPosting.id, params.id),
                eq(jobPosting.createdBy, me.id)
            )
        );

    if (!posting) {
        error(404, 'Job posting not found.');
    }

    const applicants = await db
        .select({
            id: application.id,
            applicantName: user.name,
            applicantEmail: user.email,
            resumeId: application.resumeId,
            resumeName: resume.fileName,
            appliedAt: application.createdAt
        })
        .from(application)
        .innerJoin(user, eq(application.userId, user.id))
        .leftJoin(
            resume,
            and(
                eq(application.resumeId, resume.id),
                eq(resume.userId, application.userId)
            )
        )
        .where(eq(application.jobPostingId, posting.id))
        .orderBy(desc(application.createdAt));

    return { posting, applicants };
};
