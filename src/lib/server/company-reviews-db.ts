import { and, eq } from 'drizzle-orm';
import { db } from './db';
import { companyReview } from './db/schema';

// US-09: changing or deleting your review, used by the company page and My reviews.
// Both only touch your own review of that company, and say false if there isn't one

const yours = (companyId: string, userId: string) =>
	and(eq(companyReview.companyId, companyId), eq(companyReview.userId, userId));

export async function editReview(companyId: string, userId: string, values: { rating: number; body: string }) {
	const changed = await db
		.update(companyReview)
		.set({ ...values, updatedAt: new Date() })
		.where(yours(companyId, userId))
		.returning({ id: companyReview.id });
	return changed.length > 0;
}

export async function deleteReview(companyId: string, userId: string) {
	const deleted = await db.delete(companyReview).where(yours(companyId, userId)).returning({ id: companyReview.id });
	return deleted.length > 0;
}
