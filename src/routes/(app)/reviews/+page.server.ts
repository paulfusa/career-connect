import { desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { companyProfile, companyReview } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

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

	// recruiters get a shortcut to what people wrote about their own company
	const [ownCompany] =
		me.role === 'recruiter'
			? await db.select({ id: companyProfile.id, name: companyProfile.name }).from(companyProfile).where(eq(companyProfile.recruiterId, me.id))
			: [];

	return { reviews, ownCompany: ownCompany ?? null };
};
