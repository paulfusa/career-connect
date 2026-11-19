import { error, fail } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { companyProfile, companyReview } from '$lib/server/db/schema';
import { isId, ONLY_JOB_SEEKERS, parseReview } from '$lib/server/company-reviews';
import { deleteReview, editReview } from '$lib/server/company-reviews-db';
import type { Actions, PageServerLoad } from './$types';

// US-09: every review you wrote, newest first. Only job seekers write reviews, like My Applications
export const load: PageServerLoad = async ({ locals }) => {
	const me = locals.user;
	if (!me || me.role !== 'job_seeker') error(403, 'Only job seekers can see My reviews.');

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

	return { reviews };
};

// same as on the company page, but the company comes from the form
const gone = "That review doesn't exist anymore.";

export const actions: Actions = {
	edit: async ({ request, locals }) => {
		if (locals.user!.role !== 'job_seeker') return fail(403, { message: ONLY_JOB_SEEKERS });

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
