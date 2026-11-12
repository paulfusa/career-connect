import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { drizzle } from 'drizzle-orm/postgres-js';
import type { DeadlineReminderDatabase } from '../src/lib/server/deadline-reminders-db.ts';
import type { RunnerDependencies } from '../scripts/deadline-reminders.ts';

// Only resolves the existing extensionless schema import for plain node --test.
// No database singleton or environment module is imported by this test graph.
registerHooks({
	resolve(specifier, context, next) {
		if (specifier === './auth.schema') {
			return { url: new URL('../src/lib/server/db/auth.schema.ts', import.meta.url).href, shortCircuit: true };
		}
		return next(specifier, context);
	}
});

const { buildDeadlineReminderInsert, generateDeadlineReminders } = await import('../src/lib/server/deadline-reminders-db.ts');
const { main } = await import('../scripts/deadline-reminders.ts');

// drizzle.mock compiles real SQL without creating a postgres client. Never execute it.
const mockDb = drizzle.mock();
const compile = () => buildDeadlineReminderInsert(mockDb).toSQL();

test('deadline reminders: one insert-select enforces trusted recruiter and job eligibility', () => {
	const { sql, params } = compile();
	assert.match(sql, /^insert into "notification"/);
	assert.match(sql, /select .* from "job_posting" inner join "user" on "user"\."id" = "job_posting"\."created_by"/);
	assert.match(sql, /"job_posting"\."status" = \$/);
	assert.match(sql, /"job_posting"\."published" = \$/);
	assert.match(sql, /"job_posting"\."application_deadline" is not null/);
	assert.match(sql, /"user"\."role" = \$/);
	assert.match(sql, /"user"\."email_verified" = \$/);
	assert.deepEqual(params.slice(-4), ['open', true, 'recruiter', true]);
	assert.doesNotMatch(sql, /"profile"|"application"|"session"/);
});

test('deadline reminders: range includes the deadline day and three Toronto calendar days', () => {
	const { sql } = compile();
	const today = "\\(statement_timestamp\\(\\) at time zone 'America/Toronto'\\)::date";
	assert.match(sql, new RegExp(`"job_posting"\\."application_deadline" >= ${today}`));
	assert.match(sql, new RegExp(`"job_posting"\\."application_deadline" <= ${today} \\+ 3`));
	assert.doesNotMatch(sql, /current_date|72|interval|["']UTC["']/i);
	// PostgreSQL date/DST execution semantics are deferred to isolated integration tests.
});

test('deadline reminders: payload is plain text with trusted columns, generated metadata and safe link', () => {
	const { sql, params } = compile();
	assert.match(sql, /"id", "user_id", "type", "title", "message", "link", "read_at", "created_at", "dedupe_key"/);
	assert.match(sql, /select gen_random_uuid\(\) as "id", "job_posting"\."created_by"/);
	assert.match(sql, /\|\| "job_posting"\."title" \|\|/);
	assert.match(sql, /to_char\("job_posting"\."application_deadline", 'YYYY-MM-DD'\)/);
	assert.match(sql, /null::timestamp as "read_at", statement_timestamp\(\) as "created_at"/);
	assert.deepEqual(params.slice(0, 9), [
		'application_deadline_reminder', 'Application deadline approaching',
		'Applications for your posting "', '" are accepted through ', ' (Toronto time).',
		'/jobs/', '/applications', 'application_deadline:', ':within_3_days'
	]);
});

test('deadline reminders: stable job/recipient/deadline/window key uses targeted atomic conflict handling', () => {
	const first = compile();
	assert.deepEqual(compile(), first);
	assert.match(first.sql, /\|\| "job_posting"\."id"::text \|\| ':' \|\| "job_posting"\."created_by" \|\| ':' \|\| to_char\("job_posting"\."application_deadline", 'YYYY-MM-DD'\)/);
	assert.match(first.sql, /on conflict \("dedupe_key"\) do nothing returning "id"$/);
	assert.doesNotMatch(first.sql, /do update/i);
	// Uniqueness under concurrent execution requires real PostgreSQL integration tests.
});

test('deadline reminders: both message and dedupe key format the deadline independently of DateStyle', () => {
	const { sql } = compile();
	const isoDate = /to_char\("job_posting"\."application_deadline", 'YYYY-MM-DD'\)/g;
	assert.equal((sql.match(isoDate) ?? []).length, 2);
	assert.doesNotMatch(sql, /"application_deadline"::text/);
	assert.match(sql, /to_char\("job_posting"\."application_deadline", 'YYYY-MM-DD'\) \|\| \$\d+ as "message"/);
	assert.match(sql, /to_char\("job_posting"\."application_deadline", 'YYYY-MM-DD'\) \|\| \$\d+ as "dedupe_key"/);
});

test('deadline reminders: generation reports inserted count, including zero for duplicate/no eligible rows', async () => {
	for (const count of [0, 2]) {
		let executed = 0;
		const db = {
			select: mockDb.select.bind(mockDb),
			insert: () => ({
				select: () => ({
					onConflictDoNothing: () => ({
						returning: async () => {
							executed++;
							return Array.from({ length: count }, (_, index) => ({ id: String(index) }));
						}
					})
				})
			})
		} as unknown as DeadlineReminderDatabase;
		assert.deepEqual(await generateDeadlineReminders(db), { created: count });
		assert.equal(executed, 1);
	}
});

function runnerFixture() {
	const events: string[] = [];
	const info: unknown[][] = [];
	const errors: unknown[][] = [];
	const urls: string[] = [];
	const dependencies: RunnerDependencies = {
		connect(url) {
			events.push('connect');
			urls.push(url);
			return { db: mockDb, close: async () => { events.push('close'); } };
		},
		generate: async (db) => {
			assert.strictEqual(db, mockDb);
			events.push('generate');
			return { created: 2 };
		},
		info: (...args) => { info.push(args); },
		error: (...args) => { errors.push(args); }
	};
	return { dependencies, events, info, errors, urls };
}

// This is a non-routable placeholder, never used with a real connection factory.
const fakeUrl = 'postgresql://unit-test.invalid/unused';

test('deadline runner: missing credential fails before connecting, including with DATABASE_URL set', async () => {
	for (const env of [{}, { REMINDER_DATABASE_URL: '' }, { REMINDER_DATABASE_URL: ' \t' }, { DATABASE_URL: fakeUrl }]) {
		const { dependencies, events, errors } = runnerFixture();
		assert.equal(await main(env, dependencies), 1);
		assert.deepEqual(events, []);
		assert.deepEqual(errors, [['Deadline reminder job not configured', { errorName: 'MissingReminderCredential' }]]);
	}
});

test('deadline runner: uses only dedicated credential, closes client and reports count', async () => {
	const { dependencies, events, info, errors, urls } = runnerFixture();
	assert.equal(await main({ REMINDER_DATABASE_URL: fakeUrl, DATABASE_URL: 'ignored' }, dependencies), 0);
	assert.deepEqual(events, ['connect', 'generate', 'close']);
	assert.deepEqual(urls, [fakeUrl]);
	assert.deepEqual(info, [['Deadline reminder job completed', { created: 2 }]]);
	assert.deepEqual(errors, []);
});

test('deadline runner: generation failure closes client and never leaks raw errors', async () => {
	const { dependencies, events, info, errors } = runnerFixture();
	dependencies.generate = async () => { throw new Error('Private query and connection details'); };
	assert.equal(await main({ REMINDER_DATABASE_URL: fakeUrl }, dependencies), 1);
	assert.deepEqual(events, ['connect', 'close']);
	assert.deepEqual(info, []);
	assert.deepEqual(errors, [['Deadline reminder job failed', { errorName: 'Error' }]]);
	assert.ok(!JSON.stringify(errors).includes(fakeUrl));
	assert.ok(!JSON.stringify(errors).includes('Private'));
});

test('deadline runner: connection failure and non-Error rejection are safely reported', async () => {
	const { dependencies, events, errors } = runnerFixture();
	dependencies.connect = () => { throw 'Private connection failure'; };
	assert.equal(await main({ REMINDER_DATABASE_URL: fakeUrl }, dependencies), 1);
	assert.deepEqual(events, []);
	assert.deepEqual(errors, [['Deadline reminder job failed', { errorName: 'UnknownError' }]]);
});

test('deadline runner: shutdown failure returns failure rather than a misleading success', async () => {
	const { dependencies, info, errors } = runnerFixture();
	dependencies.connect = () => ({ db: mockDb, close: async () => { throw new Error('Private shutdown failure'); } });
	assert.equal(await main({ REMINDER_DATABASE_URL: fakeUrl }, dependencies), 1);
	assert.deepEqual(info, []);
	assert.deepEqual(errors, [['Deadline reminder job failed', { errorName: 'Error' }]]);
});

test('deadline runner: direct CLI safely fails with both database variables removed and no dotenv loading', () => {
	const env = { ...process.env };
	for (const key of Object.keys(env)) {
		if (['DATABASE_URL', 'REMINDER_DATABASE_URL', 'NODE_OPTIONS'].includes(key.toUpperCase())) delete env[key];
	}
	const result = spawnSync(process.execPath, ['--import', 'tsx', fileURLToPath(new URL('../scripts/deadline-reminders.ts', import.meta.url))], {
		env, encoding: 'utf8', timeout: 15_000
	});
	assert.equal(result.status, 1);
	assert.equal(result.stdout, '');
	assert.match(result.stderr, /Deadline reminder job not configured/);
	assert.match(result.stderr, /MissingReminderCredential/);
	assert.doesNotMatch(result.stderr, /postgresql:\/\//);
});

test('deadline runner: importing the entry point performs no work or logging', async (t) => {
	// Re-import a fresh module instance; direct-entry detection must stay false.
	const logs: unknown[][] = [];
	const originalInfo = console.info;
	const originalError = console.error;
	console.info = (...args) => { logs.push(args); };
	console.error = (...args) => { logs.push(args); };
	t.after(() => { console.info = originalInfo; console.error = originalError; });
	await import(new URL('../scripts/deadline-reminders.ts?import-safety', import.meta.url).href);
	assert.deepEqual(logs, []);
});

test('deadline workflow: manual-only job requires literal JSON true and the full default branch ref', () => {
	const workflow = readFileSync(new URL('../.github/workflows/deadline-reminders.yml', import.meta.url), 'utf8');
	assert.match(workflow, /^on:\s*\n  workflow_dispatch:\s*\n/m);
	assert.doesNotMatch(workflow, /^\s*(schedule|cron|push|pull_request|pull_request_target):/m);
	assert.match(workflow, /jobs:\s*\n  generate:\s*\n(?:\s*#[^\n]*\n)*    if: \$\{\{ vars\.DEADLINE_REMINDERS_ENABLED == 'true' && fromJSON\(vars\.DEADLINE_REMINDERS_ENABLED \|\| 'false'\) == true && github\.ref == format\('refs\/heads\/\{0\}', github\.event\.repository\.default_branch\) \}\}/);
	assert.doesNotMatch(workflow, /github\.ref_name/);
	assert.match(workflow, /permissions:\s*\n  contents: read/);
	assert.match(workflow, /cancel-in-progress: false/);
	assert.match(workflow, /timeout-minutes: 10/);
	assert.match(workflow, /run: pnpm install --frozen-lockfile/);
	assert.match(workflow, /run: pnpm reminders:deadlines\s*\n        env:\s*\n          REMINDER_DATABASE_URL: \$\{\{ secrets\.REMINDER_DATABASE_URL \}\}/);
	assert.equal((workflow.match(/secrets\./g) ?? []).length, 1);
	assert.doesNotMatch(workflow, /\bDATABASE_URL\b/);
	const ci = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
	assert.doesNotMatch(ci, /REMINDER_DATABASE_URL|reminders:deadlines/);
});
