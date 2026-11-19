import { error, fail } from '@sveltejs/kit';
import { asc, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { companyProfile, companyReview, jobPosting, user } from '$lib/server/db/schema';
import { canReviewCompany, canSeeReviews, isSlug, ONLY_JOB_SEEKERS, parseReview, ratingSummary, reviewProblem } from '$lib/server/company-reviews';
import { deleteReview, editReview, slugOf, yourCompanies } from '$lib/server/company-reviews-db';
import type { Actions, PageServerLoad } from './$types';

// a company doesn't need a profile, a job or an old review with its name is enough
async function findCompany(slug: string) {
	if (!isSlug(slug)) return null;

	const [profile] = await db
		.select({ name: companyProfile.name, description: companyProfile.description, location: companyProfile.location, website: companyProfile.website })
		.from(companyProfile)
		.where(eq(slugOf(companyProfile.name), slug))
		.orderBy(asc(companyProfile.createdAt))
		.limit(1);
	if (profile) return { slug, name: profile.name, profile };

	const [posting] = await db
		.select({ name: jobPosting.company })
		.from(jobPosting)
		.where(eq(slugOf(jobPosting.company), slug))
		.orderBy(desc(jobPosting.createdAt))
		.limit(1);
	if (posting) return { slug, name: posting.name, profile: null };

	const [review] = await db.select({ name: companyReview.companyName }).from(companyReview).where(eq(companyReview.companySlug, slug)).limit(1);
	return review ? { slug, name: review.name, profile: null } : null;
}

const isYours = async (userId: string, slug: string) => (await yourCompanies(userId)).some((company) => company.slug === slug);

// US-09: company page with its reviews
export const load: PageServerLoad = async ({ params, locals }) => {
	const company = await findCompany(params.slug);
	if (!company) error(404, 'Company not found.');
	const me = locals.user!.id;
	const yours = await isYours(me, company.slug);
	if (!canSeeReviews(locals.user, yours)) error(403, 'Recruiters can only see the reviews of their own companies.');

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
		.where(eq(companyReview.companySlug, company.slug))
		.orderBy(desc(companyReview.createdAt));

	// no need to send everyone's user id, just flag yours
	const reviews = rows.map(({ userId, ...review }) => ({ ...review, mine: userId === me }));

	return {
		company,
		reviews,
		summary: ratingSummary(rows.map((row) => row.rating)),
		canReview: canReviewCompany(locals.user, yours),
		isOwner: yours
	};
};

export const actions: Actions = {
	post: async ({ params, request, locals }) => {
		const company = await findCompany(params.slug);
		if (!company) return fail(404, { message: 'Company not found.' });
		const problem = reviewProblem(locals.user, await isYours(locals.user!.id, company.slug));
		if (problem) return fail(403, { message: problem });

		const { values, errors } = parseReview(await request.formData());
		if (values.rating === null || Object.keys(errors).length > 0) return fail(400, { values, errors });

		const added = await db
			.insert(companyReview)
			.values({ companySlug: company.slug, companyName: company.name, userId: locals.user!.id, rating: values.rating, body: values.body })
			.onConflictDoNothing({ target: [companyReview.companySlug, companyReview.userId] })
			.returning({ id: companyReview.id });
		if (added.length === 0) return fail(400, { message: 'You already reviewed this company. You can edit your review instead.' });

		return { posted: true };
	},

	edit: async ({ params, request, locals }) => {
		if (!isSlug(params.slug)) return fail(404, { message: 'Company not found.' });
		if (locals.user!.role !== 'job_seeker') return fail(403, { message: ONLY_JOB_SEEKERS });

		const { values, errors } = parseReview(await request.formData());
		if (values.rating === null || Object.keys(errors).length > 0) return fail(400, { values, errors, editing: true });

		const saved = await editReview(params.slug, locals.user!.id, { rating: values.rating, body: values.body });
		if (!saved) return fail(404, { message: "You haven't reviewed this company." });

		return { updated: true };
	},

	delete: async ({ params, locals }) => {
		if (!isSlug(params.slug)) return fail(404, { message: 'Company not found.' });

		if (!(await deleteReview(params.slug, locals.user!.id))) return fail(404, { message: "You haven't reviewed this company." });

		return { deleted: true };
	}
};
