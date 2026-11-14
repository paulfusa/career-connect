import { and, eq, gte, isNotNull, lte, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { jobPosting, notification, user } from './db/schema.ts';

export type DeadlineReminderDatabase = Pick<PostgresJsDatabase, 'select' | 'insert'>;

// Trusted batch operation: eligibility and insertion share one statement snapshot.
// Do not import the SvelteKit database singleton; the runner injects its own client.
export function buildDeadlineReminderInsert(db: DeadlineReminderDatabase) {
	const today = sql`(statement_timestamp() at time zone 'America/Toronto')::date`;
	const deadlineDate = sql<string>`to_char(${jobPosting.applicationDeadline}, 'YYYY-MM-DD')`;
	const candidates = db.select({
		id: sql<string>`gen_random_uuid()`.as('id'),
		userId: jobPosting.createdBy,
		type: sql<string>`${'application_deadline_reminder'}`.as('type'),
		title: sql<string>`${'Application deadline approaching'}`.as('title'),
		message: sql<string>`${'Applications for your posting "'} || ${jobPosting.title} || ${'" are accepted through '} || ${deadlineDate} || ${' (Toronto time).'}`.as('message'),
		link: sql<string>`${'/jobs/'} || ${jobPosting.id}::text || ${'/applications'}`.as('link'),
		readAt: sql<Date | null>`null::timestamp`.as('read_at'),
		createdAt: sql<Date>`statement_timestamp()`.as('created_at'),
		dedupeKey: sql<string>`${'application_deadline:'} || ${jobPosting.id}::text || ':' || ${jobPosting.createdBy} || ':' || ${deadlineDate} || ${':within_3_days'}`.as('dedupe_key')
	})
		.from(jobPosting)
		.innerJoin(user, eq(user.id, jobPosting.createdBy))
		.where(and(
			eq(jobPosting.status, 'open'),
			eq(jobPosting.published, true),
			isNotNull(jobPosting.applicationDeadline),
			gte(jobPosting.applicationDeadline, today),
			lte(jobPosting.applicationDeadline, sql`${today} + 3`),
			eq(user.role, 'recruiter'),
			eq(user.emailVerified, true)
		));

	return db.insert(notification)
		.select(candidates)
		.onConflictDoNothing({ target: notification.dedupeKey })
		.returning({ id: notification.id });
}

export async function generateDeadlineReminders(db: DeadlineReminderDatabase): Promise<{ created: number }> {
	const inserted = await buildDeadlineReminderInsert(db);
	return { created: inserted.length };
}
