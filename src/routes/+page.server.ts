import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { MAX_ANSWER_LENGTH, QUESTIONS } from '$lib/onboarding';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	// hooks.server.ts already redirects guests, so user is set here
	return { user: locals.user! };
};

export const actions: Actions = {
	logout: async ({ request }) => {
		await auth.api.signOut({ headers: request.headers });
		redirect(303, '/login');
	},

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

		await db
			.update(user)
			.set({ ...answers, onboardedAt: new Date() })
			.where(eq(user.id, locals.user!.id));
	},

	skipOnboarding: async ({ locals }) => {
		await db.update(user).set({ onboardedAt: new Date() }).where(eq(user.id, locals.user!.id));
	}
};
