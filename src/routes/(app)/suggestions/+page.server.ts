import { fail } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { featureSuggestion } from '$lib/server/db/schema';
import { parseSuggestion } from '$lib/server/feature-suggestions';
import type { Actions, PageServerLoad } from './$types';

// US-06: the form, and the suggestions you sent with their status, newest first
export const load: PageServerLoad = async ({ locals }) => {
	const mine = await db
		.select({
			id: featureSuggestion.id,
			title: featureSuggestion.title,
			status: featureSuggestion.status,
			createdAt: featureSuggestion.createdAt
		})
		.from(featureSuggestion)
		.where(eq(featureSuggestion.userId, locals.user!.id))
		.orderBy(desc(featureSuggestion.createdAt));

	return { mine };
};

export const actions: Actions = {
	suggest: async ({ request, locals }) => {
		const { values, errors } = parseSuggestion(await request.formData());
		if (Object.keys(errors).length > 0) return fail(400, { values, errors });

		await db.insert(featureSuggestion).values({ userId: locals.user!.id, ...values });
		return { success: true };
	}
};
