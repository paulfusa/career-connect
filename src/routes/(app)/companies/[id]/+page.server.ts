import { error, fail } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { companyProfile, companyReview, user } from '$lib/server/db/schema';
import { canReviewCompany, parseReview, ratingSummary } from '$lib/server/company-reviews';
import type { Actions, PageServerLoad } from './$types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function findCompany(id: string) {
	if (!UUID.test(id)) return null;
	const [company] = await db.select().from(companyProfile).where(eq(companyProfile.id, id));
	return company ?? null;
}

// your own review of this company
const yours = (companyId: string, userId: string) =>
	and(eq(companyReview.companyId, companyId), eq(companyReview.userId, userId));

// US-09: company page with its reviews
export const load: PageServerLoad = async ({ params, locals }) => {
	const company = await findCompany(params.id);
	if (!company) error(404, 'Company not found.');

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
		if (!canReviewCompany(locals.user, company)) return fail(403, { message: "You can't review your own company." });

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
		if (!UUID.test(params.id)) return fail(404, { message: 'Company not found.' });

		const { values, errors } = parseReview(await request.formData());
		if (values.rating === null || Object.keys(errors).length > 0) return fail(400, { values, errors, editing: true });

		const changed = await db
			.update(companyReview)
			.set({ rating: values.rating, body: values.body, updatedAt: new Date() })
			.where(yours(params.id, locals.user!.id))
			.returning({ id: companyReview.id });
		if (changed.length === 0) return fail(404, { message: "You haven't reviewed this company." });

		return { updated: true };
	},

	delete: async ({ params, locals }) => {
		if (!UUID.test(params.id)) return fail(404, { message: 'Company not found.' });

		const deleted = await db
			.delete(companyReview)
			.where(yours(params.id, locals.user!.id))
			.returning({ id: companyReview.id });
		if (deleted.length === 0) return fail(404, { message: "You haven't reviewed this company." });

		return { deleted: true };
	}
};
