
import { error, fail } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { application, applicationOutcome, jobPosting, resume, user } from '$lib/server/db/schema';
import { parseOutcome } from '$lib/server/application-outcome';
import { findOwnedApplication, saveOutcome } from '$lib/server/outcomes';
import { needsReminder } from '$lib/server/reminders';
import type { Actions, PageServerLoad } from './$types';

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
            appliedAt: application.createdAt,
            // US-03: null until the recruiter sends a decision
            outcome: applicationOutcome
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
        .leftJoin(applicationOutcome, eq(applicationOutcome.applicationId, application.id))
        .where(eq(application.jobPostingId, posting.id))
        .orderBy(desc(application.createdAt));

    const now = new Date();

    return {
        posting,
        applicants: applicants.map((applicant) => ({
            ...applicant,
            needsReminder: needsReminder(applicant.appliedAt, !!applicant.outcome, now)
        }))
    };
};

export const actions: Actions = {
    // US-03: the recruiter sends an offer or a rejection to one applicant
    decide: async ({ request, locals }) => {
        const me = locals.user!;

        if (me.role !== 'recruiter') {
            return fail(403, { error: 'Only recruiters can send decisions.' });
        }

        const data = await request.formData();
        const applicationId = data.get('applicationId')?.toString() ?? '';

        // Only the recruiter who posted the job can answer its applications.
        if (!UUID.test(applicationId) || !(await findOwnedApplication(applicationId, me.id))) {
            return fail(404, { error: 'Application not found.' });
        }

        const parsed = parseOutcome(data);

        if (!parsed.ok) {
            return fail(400, { applicationId, errors: parsed.errors, values: parsed.values });
        }

        const saved = await saveOutcome(applicationId, parsed.values);

        if (!saved) {
            return fail(400, { applicationId, error: 'A decision was already sent for this application.' });
        }

        return { applicationId, success: 'Decision sent to the applicant.' };
    }
};
