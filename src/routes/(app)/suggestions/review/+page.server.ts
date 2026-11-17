import { error, fail } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { featureSuggestion, user } from '$lib/server/db/schema';
import { canReviewSuggestions, isSuggestionStatus, parseStatusChange } from '$lib/server/feature-suggestions';
import type { Actions, PageServerLoad } from './$types';

// US-06: admins only, everyone else gets a 404
export const load: PageServerLoad = async ({ locals, url }) => {
	if (!canReviewSuggestions(locals.user)) error(404, 'Not found');

	const filter = url.searchParams.get('status');
	const status = isSuggestionStatus(filter) ? filter : null;

	const suggestions = await db
		.select({
			id: featureSuggestion.id,
			title: featureSuggestion.title,
			description: featureSuggestion.description,
			benefit: featureSuggestion.benefit,
			status: featureSuggestion.status,
			createdAt: featureSuggestion.createdAt,
			authorName: user.name,
			authorRole: user.role
		})
		.from(featureSuggestion)
		.innerJoin(user, eq(featureSuggestion.userId, user.id))
		.where(status ? eq(featureSuggestion.status, status) : undefined)
		.orderBy(desc(featureSuggestion.createdAt));

	return { suggestions, status };
};

export const actions: Actions = {
	status: async ({ request, locals }) => {
		if (!canReviewSuggestions(locals.user)) error(404, 'Not found');

		const change = parseStatusChange(await request.formData());
		if (!change) return fail(400, { message: 'That suggestion or status is not valid.' });

		const updated = await db
			.update(featureSuggestion)
			.set({ status: change.status, updatedAt: new Date() })
			.where(eq(featureSuggestion.id, change.id))
			.returning({ id: featureSuggestion.id });
		if (updated.length === 0) return fail(404, { message: 'That suggestion no longer exists.' });

		return { success: 'Status saved.', id: change.id };
	}
};
