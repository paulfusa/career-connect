import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { generateDeadlineReminders, type DeadlineReminderDatabase } from '../src/lib/server/deadline-reminders-db.ts';

type Connection = { db: DeadlineReminderDatabase; close(): Promise<void> };
type Log = (message: string, context: Record<string, string | number>) => void;
export type RunnerDependencies = {
	connect(url: string): Connection;
	generate(db: DeadlineReminderDatabase): Promise<{ created: number }>;
	info: Log;
	error: Log;
};

const defaults: RunnerDependencies = {
	connect(url) {
		const client = postgres(url, {
			prepare: false,
			max: 1,
			ssl: 'require',
			connect_timeout: 10,
			connection: { statement_timeout: 60_000 }
		});
		return { db: drizzle(client), close: () => client.end({ timeout: 5 }) };
	},
	generate: generateDeadlineReminders,
	info: (message, context) => console.info(message, context),
	error: (message, context) => console.error(message, context)
};

// No dotenv loading or DATABASE_URL fallback. Tests inject all I/O dependencies.
export async function main(
	env: Readonly<Record<string, string | undefined>> = process.env,
	dependencies: RunnerDependencies = defaults
): Promise<number> {
	const url = env.REMINDER_DATABASE_URL?.trim();
	if (!url) {
		dependencies.error('Deadline reminder job not configured', { errorName: 'MissingReminderCredential' });
		return 1;
	}

	try {
		const connection = dependencies.connect(url);
		let result: { created: number };
		try {
			result = await dependencies.generate(connection.db);
		} finally {
			await connection.close();
		}
		dependencies.info('Deadline reminder job completed', { created: result.created });
		return 0;
	} catch (error) {
		// Database errors may include credentials, SQL or posting content. Never log them.
		dependencies.error('Deadline reminder job failed', {
			errorName: error instanceof Error ? error.name : 'UnknownError'
		});
		return 1;
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
	process.exitCode = await main();
}
