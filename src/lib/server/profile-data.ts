import { asc, desc, eq, sql } from 'drizzle-orm';
import { db } from './db';
import { education, experience } from './db/schema';

// A user's experience (current roles first, then most recent) and education (most recent first).
// Shared by the owner's /profile and the recruiter view /profile/[id].
export async function loadEntries(userId: string) {
	const [experiences, schools] = await Promise.all([
		db
			.select()
			.from(experience)
			.where(eq(experience.userId, userId))
			.orderBy(sql`${experience.endDate} desc nulls first`, desc(experience.startDate)),
		db
			.select()
			.from(education)
			.where(eq(education.userId, userId))
			.orderBy(sql`${education.endYear} desc nulls first`, desc(education.startYear), asc(education.createdAt))
	]);
	return { experience: experiences, education: schools };
}
