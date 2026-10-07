import { and, eq } from 'drizzle-orm';
import { db } from './db';
import { resume } from './db/schema';

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The resume with this id, only if it belongs to this user. The ownership check for every resume page.
export async function findOwnResume(id: string, userId: string) {
	if (!UUID.test(id)) return null;
	const [row] = await db.select().from(resume).where(and(eq(resume.id, id), eq(resume.userId, userId)));
	return row ?? null;
}
