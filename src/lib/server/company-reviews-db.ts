import { and, eq } from 'drizzle-orm';
import { db } from './db';
import { companyReview } from './db/schema';

// US-09: edit and delete for the company page and My reviews.
// They only touch your own review, and return false if you don't have one

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
