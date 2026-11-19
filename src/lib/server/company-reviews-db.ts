import { and, eq, inArray, sql, type SQLWrapper } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { companyProfile, companyReview, jobPosting } from '$lib/server/db/schema';
import { toRating } from '$lib/server/company-reviews';

// US-09: the database side of company reviews

// the same as companySlug, but in SQL, so queries can match names on postings and profiles
export const slugOf = (name: SQLWrapper) => sql<string>`trim(both '-' from regexp_replace(lower(${name}), '[^a-z0-9]+', '-', 'g'))`;

// the companies someone is part of: the one on their company profile, and the ones on jobs they posted
export const yourCompanySlugs = (userId: string) =>
	sql`select ${slugOf(companyProfile.name)} from ${companyProfile} where ${companyProfile.recruiterId} = ${userId}
		union select ${slugOf(jobPosting.company)} from ${jobPosting} where ${jobPosting.createdBy} = ${userId}`;

// same list for the Company reviews page, with names. Your company profile comes first
export async function yourCompanies(userId: string): Promise<{ slug: string; name: string }[]> {
	const profiles = await db.select({ slug: slugOf(companyProfile.name), name: companyProfile.name }).from(companyProfile).where(eq(companyProfile.recruiterId, userId));
	const postings = await db.select({ slug: slugOf(jobPosting.company), name: jobPosting.company }).from(jobPosting).where(eq(jobPosting.createdBy, userId));
	const companies = new Map<string, string>();
	for (const { slug, name } of [...profiles, ...postings]) {
		if (slug && !companies.has(slug)) companies.set(slug, name);
	}
	return [...companies].map(([slug, name]) => ({ slug, name }));
}

// average stars for a few companies at once. Companies with no reviews aren't in the map
export async function ratingsFor(slugs: string[]) {
	if (slugs.length === 0) return new Map<string, { average: number; count: number }>();
	const rows = await db
		.select({ slug: companyReview.companySlug, average: sql<string | null>`avg(${companyReview.rating})`, count: sql<number>`count(*)::int` })
		.from(companyReview)
		.where(inArray(companyReview.companySlug, slugs))
		.groupBy(companyReview.companySlug);
	return new Map(rows.flatMap(({ slug, average, count }) => {
		const rating = toRating(average, count);
		return rating ? [[slug, rating] as const] : [];
	}));
}

// edit and delete for the company page and My reviews.
// They only touch your own review, and return false if you don't have one

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
