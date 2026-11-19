import { fail } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { companyProfile, companyReview } from '$lib/server/db/schema';
import { isId, parseReview } from '$lib/server/company-reviews';
import { deleteReview, editReview } from '$lib/server/company-reviews-db';
import type { Actions, PageServerLoad } from './$types';

// US-09: every review you wrote, newest first
export const load: PageServerLoad = async ({ locals }) => {
	const me = locals.user!;

	const reviews = await db
		.select({
			id: companyReview.id,
			rating: companyReview.rating,
			body: companyReview.body,
			createdAt: companyReview.createdAt,
			updatedAt: companyReview.updatedAt,
			companyId: companyProfile.id,
			companyName: companyProfile.name,
			companyLocation: companyProfile.location
		})
		.from(companyReview)
		.innerJoin(companyProfile, eq(companyReview.companyId, companyProfile.id))
		.where(eq(companyReview.userId, me.id))
		.orderBy(desc(companyReview.createdAt));

	// recruiters also get a link to their own company's reviews
	const [ownCompany] =
		me.role === 'recruiter'
			? await db.select({ id: companyProfile.id, name: companyProfile.name }).from(companyProfile).where(eq(companyProfile.recruiterId, me.id))
			: [];

	return { reviews, ownCompany: ownCompany ?? null };
};

// same as on the company page, but the company comes from the form
const gone = "That review doesn't exist anymore.";

export const actions: Actions = {
	edit: async ({ request, locals }) => {
		const form = await request.formData();
		const companyId = form.get('companyId');
		if (!isId(companyId)) return fail(404, { message: gone });

		const { values, errors } = parseReview(form);
		if (values.rating === null || Object.keys(errors).length > 0) return fail(400, { values, errors, companyId });

		const saved = await editReview(companyId, locals.user!.id, { rating: values.rating, body: values.body });
		if (!saved) return fail(404, { message: gone });

		return { updated: true };
	},

	delete: async ({ request, locals }) => {
		const companyId = (await request.formData()).get('companyId');
		if (!isId(companyId)) return fail(404, { message: gone });

		if (!(await deleteReview(companyId, locals.user!.id))) return fail(404, { message: gone });

		return { deleted: true };
	}
};
