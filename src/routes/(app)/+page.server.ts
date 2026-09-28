import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { profile, user } from '$lib/server/db/schema';
import { MAX_ANSWER_LENGTH, QUESTIONS } from '$lib/onboarding';
import type { Actions } from './$types';

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
