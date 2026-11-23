import { fail } from '@sveltejs/kit';
import { eq, count, and, desc } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { application, jobPosting, profile, user } from '$lib/server/db/schema';
import { MAX_ANSWER_LENGTH, QUESTIONS } from '$lib/onboarding';
import type { Actions } from './$types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const me = locals.user!;

	if (me.role === 'job_seeker') {
		const [total, underReview, interviews, offers] =
			await Promise.all([
				db.select({ value: count() })
					.from(application)
					.where(eq(application.userId, me.id)),

				db.select({ value: count() })
					.from(application)
					.where(and(
						eq(application.userId, me.id),
						eq(application.status, 'under_review')
					)),

				db.select({ value: count() })
					.from(application)
					.where(and(
						eq(application.userId, me.id),
						eq(application.status, 'interview')
					)),

				db.select({ value: count() })
					.from(application)
					.where(and(
						eq(application.userId, me.id),
						eq(application.status, 'offered')
					))
			]);

		const recentApplications = await db
			.select({
				id: application.id,
				jobTitle: jobPosting.title,
				jobPostingId: jobPosting.id,
				company: jobPosting.company,
				status: application.status,
				createdAt: application.createdAt
			})
			.from(application)
			.innerJoin(
				jobPosting,
				eq(application.jobPostingId, jobPosting.id)
			)
			.where(eq(application.userId, me.id))
			.orderBy(desc(application.createdAt))
			.limit(5);

		return {
			stats: {
				totalApplications: total[0].value,
				underReview: underReview[0].value,
				interviews: interviews[0].value,
				offers: offers[0].value
			},
			recentApplications
		};
	}
	if (me.role === 'recruiter') {
		const owner = eq(jobPosting.createdBy, me.id);

		const [activePostings, totalApplications, awaitingReview, interviews] =
			await Promise.all([
				db.select({ value: count() })
					.from(jobPosting)
					.where(and(
						owner,
						eq(jobPosting.status, 'open'),
						eq(jobPosting.published, true),
						eq(jobPosting.archived, false)
					)),

				db.select({ value: count() })
					.from(application)
					.innerJoin(jobPosting, eq(application.jobPostingId, jobPosting.id))
					.where(owner),

				db.select({ value: count() })
					.from(application)
					.innerJoin(jobPosting, eq(application.jobPostingId, jobPosting.id))
					.where(and(owner, eq(application.status, 'applied'))),

				db.select({ value: count() })
					.from(application)
					.innerJoin(jobPosting, eq(application.jobPostingId, jobPosting.id))
					.where(and(owner, eq(application.status, 'interview')))
			]);

			const recentApplications = await db
				.select({
					id: application.id,
					jobPostingId: jobPosting.id,
					applicantName: user.name,
					jobTitle: jobPosting.title,
					status: application.status,
					createdAt: application.createdAt
				})
				.from(application)
				.innerJoin(
					jobPosting,
					eq(application.jobPostingId, jobPosting.id)
				)
				.innerJoin(
					user,
					eq(application.userId, user.id)
				)
				.where(eq(jobPosting.createdBy, me.id))
				.orderBy(desc(application.createdAt))
				.limit(5);

		return {
			stats: {
				activePostings: activePostings[0].value,
				totalApplications: totalApplications[0].value,
				awaitingReview: awaitingReview[0].value,
				interviews: interviews[0].value
			},
			recentApplications
		};
	}

	return {
		stats: {
			totalApplications: 0,
			underReview: 0,
			interviews: 0,
			offers: 0
		}
	};
};

export const actions: Actions = {
	onboard: async ({ request, locals }) => {
		const data = await request.formData();
		const answers: Record<string, string> = {};

		// only accept the fields asked for this user's role
		for (const { name, label } of QUESTIONS[locals.user!.role]) {
			const value = data.get(name)?.toString().trim() ?? '';
			if (!value) return fail(400, { message: `Fill in ${label.toLowerCase()}, or skip for now.` });
			if (value.length > MAX_ANSWER_LENGTH) {
				return fail(400, { message: `${label} must be ${MAX_ANSWER_LENGTH} characters or fewer.` });
			}
			answers[name] = value;
		}

		// company autocomplete adds the company's domain (for its logo); ignored if malformed
		const domain = data.get('companyDomain')?.toString().toLowerCase() ?? '';
		if (answers.company && /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(domain)) answers.companyDomain = domain;

		const userId = locals.user!.id;
		await db.transaction(async (tx) => {
			await tx
				.insert(profile)
				.values({ userId, ...answers })
				.onConflictDoUpdate({ target: profile.userId, set: { ...answers, updatedAt: new Date() } });
			await tx.update(user).set({ onboardedAt: new Date() }).where(eq(user.id, userId));
		});
	},

	skipOnboarding: async ({ locals }) => {
		await db.update(user).set({ onboardedAt: new Date() }).where(eq(user.id, locals.user!.id));
	}
};
