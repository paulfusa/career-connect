import { and, asc, eq, inArray, sql, type SQLWrapper } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { companyProfile, companyReview } from '$lib/server/db/schema';
import { toRating } from '$lib/server/company-reviews';

// US-09: database stuff for company reviews

// companySlug, but in SQL
export const slugOf = (name: SQLWrapper) => sql<string>`trim(both '-' from regexp_replace(lower(${name}), '[^a-z0-9]+', '-', 'g'))`;

// your companies = your company profiles
export const yourCompanySlugs = (userId: string) =>
	sql`select ${slugOf(companyProfile.name)} from ${companyProfile} where ${companyProfile.recruiterId} = ${userId}`;

// same thing with the names
export async function yourCompanies(userId: string) {
	return db
		.select({ slug: slugOf(companyProfile.name), name: companyProfile.name, website: companyProfile.website })
		.from(companyProfile)
		.where(eq(companyProfile.recruiterId, userId))
		.orderBy(asc(companyProfile.name));
}

// average stars for a list of companies, only the ones that have reviews
export async function ratingsFor(slugs: string[]) {
	const ratings = new Map<string, { average: number; count: number }>();
	if (slugs.length === 0) return ratings;
	const rows = await db
		.select({ slug: companyReview.companySlug, average: sql<string | null>`avg(${companyReview.rating})`, count: sql<number>`count(*)::int` })
		.from(companyReview)
		.where(inArray(companyReview.companySlug, slugs))
		.groupBy(companyReview.companySlug);
	for (const row of rows) {
		const rating = toRating(row.average, row.count);
		if (rating) ratings.set(row.slug, rating);
	}
	return ratings;
}

// edit and delete only touch your own review, and return false if there isn't one

const ownReview = (slug: string, userId: string) => and(eq(companyReview.companySlug, slug), eq(companyReview.userId, userId));

export async function editReview(slug: string, userId: string, values: { rating: number; body: string }) {
	const changed = await db
		.update(companyReview)
		.set({ ...values, updatedAt: new Date() })
		.where(ownReview(slug, userId))
		.returning({ id: companyReview.id });
	return changed.length > 0;
}

export async function deleteReview(slug: string, userId: string) {
	const deleted = await db.delete(companyReview).where(ownReview(slug, userId)).returning({ id: companyReview.id });
	return deleted.length > 0;
}
