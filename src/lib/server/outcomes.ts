import { and, count, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { application, applicationOutcome, jobPosting } from '$lib/server/db/schema';
import type { OutcomeInput } from '$lib/server/application-outcome';

// US-03: saves the decision (check that the recruiter owns the posting before calling this)
// returns undefined if a decision was already sent, since there is only one per application
export async function saveOutcome(applicationId: string, values: OutcomeInput) {
	const [outcome] = await db
		.insert(applicationOutcome)
		.values({ applicationId, status: values.status, message: values.message, nextSteps: values.nextSteps || null })
		.onConflictDoNothing({ target: applicationOutcome.applicationId })
		.returning();
	return outcome;
}

// US-03: gets the decision for an application, undefined if there isn't one yet
export async function findOutcome(applicationId: string) {
	const [outcome] = await db.select().from(applicationOutcome).where(eq(applicationOutcome.applicationId, applicationId));
	return outcome;
}

// US-03: only returns the application if the recruiter owns the job it was sent to
export async function findOwnedApplication(applicationId: string, recruiterId: string) {
	const [row] = await db
		.select({ id: application.id })
		.from(application)
		.innerJoin(jobPosting, eq(application.jobPostingId, jobPosting.id))
		.where(and(eq(application.id, applicationId), eq(jobPosting.createdBy, recruiterId)));
	return row;
}

// US-05: number of applications for a job (used for the acceptance rate)
export async function submittedCount(jobPostingId: string) {
	const [{ total }] = await db.select({ total: count() }).from(application).where(eq(application.jobPostingId, jobPostingId));
	return total;
}

// US-05: how many applications got a decision and how many of those were offers
export async function decisionCounts(jobPostingId: string) {
	const outcomes = await db
		.select({ status: applicationOutcome.status })
		.from(applicationOutcome)
		.innerJoin(application, eq(applicationOutcome.applicationId, application.id))
		.where(eq(application.jobPostingId, jobPostingId));
	const offered = outcomes.filter((outcome) => outcome.status === 'offered').length;
	return { decided: outcomes.length, offered };
}