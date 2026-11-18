import { fail } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { featureSuggestion } from '$lib/server/db/schema';
import { parseSuggestion, parseSuggestionId } from '$lib/server/feature-suggestions';
import type { Actions, PageServerLoad } from './$types';

// US-06: your own suggestions, newest first
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
	},

	// you can only delete your own, and only while the team hasn't looked at it yet
	delete: async ({ request, locals }) => {
		const id = parseSuggestionId(await request.formData());
		if (!id) return fail(400, { message: 'Suggestion not found.' });

		const deleted = await db
			.delete(featureSuggestion)
			.where(and(eq(featureSuggestion.id, id), eq(featureSuggestion.userId, locals.user!.id), eq(featureSuggestion.status, 'new')))
			.returning({ id: featureSuggestion.id });
		if (deleted.length === 0) return fail(400, { message: "You can only delete your own suggestions while they're still New." });

		return { deleted: true };
	}
};
