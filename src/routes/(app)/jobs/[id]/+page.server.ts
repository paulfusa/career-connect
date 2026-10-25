import { error, fail } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { application, applicationOutcome, companyProfile, jobPosting, resume, user } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';
import { applyProblem, parseApplication, todayEastern, withdrawProblem } from '$lib/server/application';
import { isClosed } from '$lib/server/job-posting';
import { acceptanceRate } from '$lib/server/acceptance-rate';
import { decisionCounts, submittedCount } from '$lib/server/outcomes';

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
				.select({ id: application.id, outcome: applicationOutcome })
				.from(application)
				// US-03: the recruiter's decision, null until one is sent
				.leftJoin(applicationOutcome, eq(applicationOutcome.applicationId, application.id))
				.where(
					and(
						eq(application.jobPostingId, result.posting.id),
						eq(application.userId, locals.user!.id)
					)
				)
		: [];
	const deadline = result.posting.applicationDeadline;
	const today = todayEastern();

	// US-05: offers out of all applications, shown once at least one decision was made
	const submitted = await submittedCount(result.posting.id);
	const { decided, offered } = await decisionCounts(result.posting.id);

	return {
		...result,
		isOwner: result.posting.createdBy === locals.user!.id,
		isJobSeeker,
		resumes,
		alreadyApplied: !!existingApplication,
		outcome: existingApplication?.outcome ?? null,
		// the deadline day itself still counts, same as withdrawProblem
		deadlinePassed: !!deadline && today > deadline,
		// US-05: Closed when the recruiter closed it or the deadline has passed
		closed: isClosed(result.posting, today),
		acceptanceRate: acceptanceRate(submitted, offered, decided)
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
                published: jobPosting.published,
                applicationDeadline: jobPosting.applicationDeadline
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

        const problem = applyProblem(job, !!existing, todayEastern());

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
    },

    withdraw: async ({ params, locals }) => {
        const me = locals.user!;

        if (me.role !== 'job_seeker') {
            return fail(403, { error: 'Only job seekers can withdraw applications.' });
        }

        if (!UUID.test(params.id)) {
            return fail(404, { error: 'Job posting not found.' });
        }

        const [job] = await db
            .select({
                published: jobPosting.published,
                status: jobPosting.status,
                applicationDeadline: jobPosting.applicationDeadline
            })
            .from(jobPosting)
            .where(eq(jobPosting.id, params.id));

        // US-03: the application and whether the recruiter already answered it
        const [existing] = await db
            .select({ id: application.id, outcomeId: applicationOutcome.id })
            .from(application)
            .leftJoin(applicationOutcome, eq(applicationOutcome.applicationId, application.id))
            .where(
                and(
                    eq(application.jobPostingId, params.id),
                    eq(application.userId, me.id)
                )
            );

        const problem = withdrawProblem(job, !!existing, todayEastern(), !!existing?.outcomeId);

        if (problem) {
            return fail(400, { error: problem });
        }

        const deleted = await db
            .delete(application)
            .where(
                and(
                    eq(application.jobPostingId, params.id),
                    eq(application.userId, me.id)
                )
            )
            .returning({ id: application.id });

        if (deleted.length === 0) {
            return fail(404, { error: 'You have no application to withdraw.' });
        }

        return { success: 'Your application has been withdrawn.' };
    }
};