
import { error, fail } from '@sveltejs/kit';
import { and, desc, eq, exists, inArray } from 'drizzle-orm';
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
            status: application.status,
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
    },

    // US-20: the recruiter moves an application to Under Review or Interview
    updateStatus: async ({ params, locals, request }) => {
        const me = locals.user;
        if (!me || me.role !== 'recruiter') {
            return fail(403, { message: 'Only the recruiter who owns the job can update applications.' });
        }

        const data = await request.formData();
        const applicationId = data.get('applicationId')?.toString() ?? '';
        if (!UUID.test(params.id) || !UUID.test(applicationId)) {
            return fail(404, { message: 'Application not found.' });
        }

        const status = data.get('status')?.toString();
        // US-03 alone sets final decisions, together with an outcome message.
        if (status !== 'under_review' && status !== 'interview') {
            return fail(400, { message: 'Choose Under Review or Interview. Offers and rejections require an outcome message.' });
        }

        const [updated] = await db.update(application)
            .set({ status, updatedAt: new Date() })
            .where(and(
                eq(application.id, applicationId),
                eq(application.jobPostingId, params.id),
                inArray(application.status, ['applied', 'under_review', 'interview']),
                exists(db.select({ id: jobPosting.id }).from(jobPosting).where(and(
                    eq(jobPosting.id, application.jobPostingId),
                    eq(jobPosting.createdBy, me.id)
                )))
            ))
            .returning({ id: application.id });

        if (!updated) {
            return fail(404, { message: 'Application not found or cannot be updated.' });
        }
        return { success: 'Application status updated.' };
    }
};
