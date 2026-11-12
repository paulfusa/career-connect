
import { error, fail } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import { and, desc, eq, inArray, ne } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { application, applicationOutcome, jobPosting, resume, user } from '$lib/server/db/schema';
import { parseOutcome } from '$lib/server/application-outcome';
import { findOwnedApplication, saveOutcome } from '$lib/server/outcomes';
import { needsReminder } from '$lib/server/reminders';
import { notificationService } from '$lib/server/notifications-db';
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
        const me = locals.user;

        if (!me || me.role !== 'recruiter') {
            return fail(403, { error: 'Only recruiters can send decisions.' });
        }

        const data = await request.formData();
        const applicationId = data.get('applicationId')?.toString() ?? '';

        // Only the recruiter who posted the job can answer its applications.
        const owned = UUID.test(applicationId)
            ? await findOwnedApplication(applicationId, me.id)
            : undefined;
        if (!owned) {
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

        const dedupeKey = `application_outcome:${saved.id}:${owned.userId}`;

        // saveOutcome has committed both writes. Notification failure cannot undo them.
        try {
            if (saved.status !== 'offered' && saved.status !== 'rejected') {
                throw new Error('Unexpected persisted outcome status');
            }
            const offered = saved.status === 'offered';
            await notificationService.createNotification({
                userId: owned.userId,
                type: offered ? 'job_offer' : 'application_rejected',
                title: offered ? 'Job offer received' : 'Application rejected',
                message: offered
                    ? `You have received a job offer for "${owned.jobTitle}".`
                    : `Your application for "${owned.jobTitle}" was rejected.`,
                link: '/applications',
                dedupeKey
            });
        } catch (notificationError) {
            console.error('Failed to create application-outcome notification', {
                applicationId: saved.applicationId,
                outcomeId: saved.id,
                recipientId: owned.userId,
                status: saved.status,
                dedupeKey,
                errorName: notificationError instanceof Error
                    ? notificationError.name
                    : 'UnknownError'
            });
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

        const transitionId = randomUUID();
        const [updated] = await db.update(application)
            .set({ status, updatedAt: new Date() })
            .from(jobPosting)
            .where(and(
                eq(application.id, applicationId),
                eq(application.jobPostingId, params.id),
                eq(jobPosting.id, application.jobPostingId),
                eq(jobPosting.createdBy, me.id),
                inArray(application.status, ['applied', 'under_review', 'interview']),
                ne(application.status, status)
            ))
            .returning({
                id: application.id,
                userId: application.userId,
                jobPostingId: application.jobPostingId,
                status: application.status,
                jobTitle: jobPosting.title
            });

        if (!updated) {
            // An owned no-op keeps the existing success response without writing
            // a timestamp or notifying. This read never authorizes another write.
            const [unchanged] = await db
                .select({ id: application.id })
                .from(application)
                .innerJoin(jobPosting, eq(jobPosting.id, application.jobPostingId))
                .where(and(
                    eq(application.id, applicationId),
                    eq(application.jobPostingId, params.id),
                    eq(jobPosting.createdBy, me.id),
                    eq(application.status, status)
                ))
                .limit(1);

            if (unchanged) return { success: 'Application status updated.' };
            return fail(404, { message: 'Application not found or cannot be updated.' });
        }

        const interview = updated.status === 'interview';
        const dedupeKey = `application_status:${updated.id}:${updated.userId}:${updated.status}:${transitionId}`;

        // The status is saved. Delivery is best effort and cannot undo it.
        // Each genuine transition gets a key, including returns to an earlier status.
        try {
            await notificationService.createNotification({
                userId: updated.userId,
                type: interview ? 'interview_invitation' : 'application_update',
                title: interview ? 'Application moved to interview' : 'Application under review',
                message: interview
                    ? `Your application for "${updated.jobTitle}" has moved to the interview stage. No interview date or time has been scheduled through CareerConnect.`
                    : `Your application for "${updated.jobTitle}" is now under review.`,
                link: '/applications',
                dedupeKey
            });
        } catch (notificationError) {
            console.error('Failed to create application-status notification', {
                applicationId: updated.id,
                recipientId: updated.userId,
                status: updated.status,
                dedupeKey,
                errorName: notificationError instanceof Error
                    ? notificationError.name
                    : 'UnknownError'
            });
        }
        return { success: 'Application status updated.' };
    }
};
