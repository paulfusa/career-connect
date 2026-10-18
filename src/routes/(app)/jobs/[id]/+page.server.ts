import { error, fail } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { application, companyProfile, jobPosting, resume, user } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';
import { applyProblem, parseApplication } from '$lib/server/application';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!UUID.test(params.id)) error(404, 'Job posting not found.');

	const [result] = await db
		.select({
			posting: jobPosting,
			creatorName: user.name,
			companyProfile: companyProfile
		})
		.from(jobPosting)
		.innerJoin(user, eq(jobPosting.createdBy, user.id))
		.leftJoin(
			companyProfile,
			eq(companyProfile.recruiterId, jobPosting.createdBy)
		)
		.where(eq(jobPosting.id, params.id));

	if (!result || (!result.posting.published && result.posting.createdBy !== locals.user!.id)) {
		error(404, 'Job posting not found.');
	}
	const isJobSeeker = locals.user!.role === 'job_seeker';

	const resumes = isJobSeeker
		? await db
				.select()
				.from(resume)
				.where(eq(resume.userId, locals.user!.id))
				.orderBy(desc(resume.updatedAt))
		: [];

	const [existingApplication] = isJobSeeker
		? await db
				.select({ id: application.id })
				.from(application)
				.where(
					and(
						eq(application.jobPostingId, result.posting.id),
						eq(application.userId, locals.user!.id)
					)
				)
		: [];
	return {
		...result,
		isOwner: result.posting.createdBy === locals.user!.id,
		isJobSeeker,
		resumes,
		alreadyApplied: !!existingApplication
		};
};


export const actions: Actions = {
    apply: async ({ request, params, locals }) => {
        const me = locals.user!;

        // Only job seekers can apply.
        if (me.role !== 'job_seeker') {
            return fail(403, { error: 'Only job seekers can apply.' });
        }

        if (!UUID.test(params.id)) {
            return fail(404, { error: 'Job posting not found.' });
        }

        // Validate the selected resume ID.
        const parsed = parseApplication(await request.formData());

        if (!parsed.ok) {
            return fail(400, {
                error: parsed.errors.resumeId ?? 'Choose a valid resume.'
            });
        }

        // Confirm that the resume belongs to this job seeker.
        const [selectedResume] = await db
            .select({ id: resume.id })
            .from(resume)
            .where(
                and(
                    eq(resume.id, parsed.values.resumeId),
                    eq(resume.userId, me.id)
                )
            );

        if (!selectedResume) {
            return fail(400, { error: 'Selected resume not found.' });
        }

        // Check the job posting.
        const [job] = await db
            .select({
                status: jobPosting.status,
                published: jobPosting.published
            })
            .from(jobPosting)
            .where(eq(jobPosting.id, params.id));

        const [existing] = await db
            .select({ id: application.id })
            .from(application)
            .where(
                and(
                    eq(application.jobPostingId, params.id),
                    eq(application.userId, me.id)
                )
            );

        const problem = applyProblem(job, !!existing);

        if (problem) {
            return fail(400, { error: problem });
        }

        // Save the application and prevent duplicates.
        const inserted = await db
            .insert(application)
            .values({
                jobPostingId: params.id,
                userId: me.id,
                resumeId: selectedResume.id
            })
            .onConflictDoNothing({
                target: [application.jobPostingId, application.userId]
            })
            .returning({ id: application.id });

        if (inserted.length === 0) {
            return fail(400, { error: 'You have already applied to this job.' });
        }

        return { success: 'Application submitted successfully.' };
    }
};