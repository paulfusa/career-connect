import { test } from 'node:test';
import assert from 'node:assert/strict';
import { useFakes, fake } from './helpers/fakes.ts';

// The database connection module: it must refuse to start without DATABASE_URL,
// except while `vite build` analyses the routes (CI builds with no .env).
useFakes({ keep: ['server/db/index.ts'] });
const load = (n: number) => import(`../src/lib/server/db/index.ts?attempt=${n}`);

test('db: refuses to start without DATABASE_URL', async () => {
	await assert.rejects(load(1), /DATABASE_URL is not set/);
});

test("db: loads during a build without DATABASE_URL, and with it otherwise, without connecting yet", async () => {
	fake.environment.building = true;
	assert.ok((await load(2)).db);
	fake.environment.building = false;
	fake.env.DATABASE_URL = 'postgres://user:pass@localhost:5999/none';
	assert.ok((await load(3)).db);
});
