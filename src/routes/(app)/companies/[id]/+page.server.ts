import { error, fail } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { companyProfile, companyReview, user } from '$lib/server/db/schema';
import { canReviewCompany, canSeeReviews, isId, ONLY_JOB_SEEKERS, parseReview, ratingSummary, reviewProblem } from '$lib/server/company-reviews';
import { deleteReview, editReview } from '$lib/server/company-reviews-db';
import type { Actions, PageServerLoad } from './$types';

async function findCompany(id: string) {
	if (!isId(id)) return null;
	const [company] = await db.select().from(companyProfile).where(eq(companyProfile.id, id));
	return company ?? null;
}

// US-09: company page with its reviews
export const load: PageServerLoad = async ({ params, locals }) => {
	const company = await findCompany(params.id);
	if (!company) error(404, 'Company not found.');
	if (!canSeeReviews(locals.user, company)) error(403, "Recruiters can only see their own company's reviews.");

	const rows = await db
		.select({
			id: companyReview.id,
			userId: companyReview.userId,
			rating: companyReview.rating,
			body: companyReview.body,
			createdAt: companyReview.createdAt,
			updatedAt: companyReview.updatedAt,
			authorName: user.name,
			authorImage: user.image
		})
		.from(companyReview)
		.innerJoin(user, eq(companyReview.userId, user.id))
		.where(eq(companyReview.companyId, company.id))
		.orderBy(desc(companyReview.createdAt));

	const me = locals.user!.id;
	// no need to send everyone's user id, just flag yours
	const reviews = rows.map(({ userId, ...review }) => ({ ...review, mine: userId === me }));

	return {
		company,
		reviews,
		summary: ratingSummary(rows.map((row) => row.rating)),
		canReview: canReviewCompany(locals.user, company),
		isOwner: company.recruiterId === me
	};
};

export const actions: Actions = {
	post: async ({ params, request, locals }) => {
		const company = await findCompany(params.id);
		if (!company) return fail(404, { message: 'Company not found.' });
		const problem = reviewProblem(locals.user, company);
		if (problem) return fail(403, { message: problem });

		const { values, errors } = parseReview(await request.formData());
		if (values.rating === null || Object.keys(errors).length > 0) return fail(400, { values, errors });

		const added = await db
			.insert(companyReview)
			.values({ companyId: company.id, userId: locals.user!.id, rating: values.rating, body: values.body })
			.onConflictDoNothing({ target: [companyReview.companyId, companyReview.userId] })
			.returning({ id: companyReview.id });
		if (added.length === 0) return fail(400, { message: 'You already reviewed this company. You can edit your review instead.' });

		return { posted: true };
	},

	edit: async ({ params, request, locals }) => {
		if (!isId(params.id)) return fail(404, { message: 'Company not found.' });
		if (locals.user!.role !== 'job_seeker') return fail(403, { message: ONLY_JOB_SEEKERS });

		const { values, errors } = parseReview(await request.formData());
		if (values.rating === null || Object.keys(errors).length > 0) return fail(400, { values, errors, editing: true });

		const saved = await editReview(params.id, locals.user!.id, { rating: values.rating, body: values.body });
		if (!saved) return fail(404, { message: "You haven't reviewed this company." });

		return { updated: true };
	},

	delete: async ({ params, locals }) => {
		if (!isId(params.id)) return fail(404, { message: 'Company not found.' });

		if (!(await deleteReview(params.id, locals.user!.id))) return fail(404, { message: "You haven't reviewed this company." });

		return { deleted: true };
	}
};
