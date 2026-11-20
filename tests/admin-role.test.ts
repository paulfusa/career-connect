import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

// US-06: the admin role end to end. The real login hook and the real Better Auth config,
// with fakes for the database, env and emails (same idea as notification-routes.test.ts)
registerHooks({
	resolve(specifier, context, next) {
		const fakes: Record<string, string> = {
			'$lib/server/db': 'fake:admin-db',
			'$lib/server/auth': 'fake:admin-auth',
			'$lib/server/email': 'fake:admin-email',
			'$env/dynamic/private': 'fake:admin-env',
			'$app/environment': 'fake:admin-environment',
			'$app/server': 'fake:admin-server',
			'better-auth/svelte-kit': 'fake:admin-sveltekit'
		};
		if (specifier in fakes) return { url: fakes[specifier], shortCircuit: true };
		if (specifier.startsWith('$lib/')) return { url: new URL(`../src/lib/${specifier.slice(5)}.ts`, import.meta.url).href, shortCircuit: true };
		return next(specifier, context);
	},
	load(url, context, next) {
		const sources: Record<string, string> = {
			'fake:admin-db': 'export const db = {};',
			'fake:admin-auth': 'export const auth = { api: { getSession: async () => globalThis.__adminSession } };',
			'fake:admin-email': 'export const sendVerificationEmail = async () => {}; export const sendPasswordResetCode = async () => {};',
			'fake:admin-env': "export const env = { BETTER_AUTH_SECRET: 'test-secret-that-is-long-enough-1234', ORIGIN: 'http://localhost' };",
			'fake:admin-environment': 'export const building = false;',
			'fake:admin-server': 'export const getRequestEvent = () => undefined;',
			'fake:admin-sveltekit':
				"export const svelteKitHandler = ({ event, resolve }) => resolve(event); export const sveltekitCookies = () => ({ id: 'fake-cookies' });"
		};
		if (url in sources) return { format: 'module', source: sources[url], shortCircuit: true };
		return next(url, context);
	}
});

const { handle } = await import('../src/hooks.server.ts');
// the real config, not the fake one the hook gets
const { auth } = await import('../src/lib/server/auth.ts');
const { canSeeProfile } = await import('../src/lib/server/follow.ts');

const session = { expiresAt: new Date('2099-01-01') };
const admin = { id: 'admin-1', role: 'admin', emailVerified: true, email: 'admin@example.invalid' };
const seeker = { id: 'seeker-1', role: 'job_seeker', emailVerified: true, email: 'seeker@example.invalid' };

// runs the real hook and returns what the pages would get as locals.user
async function visit(user: object, viewCookie?: string) {
	(globalThis as typeof globalThis & { __adminSession: unknown }).__adminSession = { session, user };
	const locals: { user?: { role: string; isAdmin: boolean } } = {};
	const event = {
		url: new URL('http://localhost/jobs'),
		request: new Request('http://localhost/jobs'),
		cookies: { get: (name: string) => (name === 'view_as' ? viewCookie : undefined) },
		locals
	};
	const response = await handle({ event, resolve: async () => new Response('ok') } as never);
	assert.equal(response.status, 200);
	return locals.user!;
}

test('hook: an admin gets the job seeker view by default', async () => {
	const user = await visit(admin);
	assert.equal(user.role, 'job_seeker');
	assert.equal(user.isAdmin, true);
});

test('hook: an admin who switched gets the recruiter view', async () => {
	assert.equal((await visit(admin, 'recruiter')).role, 'recruiter');
});

test("hook: the view cookie doesn't do anything for a job seeker", async () => {
	const user = await visit(seeker, 'recruiter');
	assert.equal(user.role, 'job_seeker');
	assert.equal(user.isAdmin, false);
});

// if someone removed the databaseHooks block from auth.ts, these would fail
test('auth config: sign-up refuses admin accounts', async () => {
	const create = auth.options.databaseHooks?.user?.create?.before;
	assert.ok(create, 'auth.ts should have a create hook for users');
	assert.equal(await create({ role: 'admin' } as never), false);
	assert.equal(await create({ role: 'job_seeker' } as never), true);
	assert.equal(await create({ role: 'recruiter' } as never), true);
});

test('auth config: updates drop any role change', async () => {
	const update = auth.options.databaseHooks?.user?.update?.before;
	assert.ok(update, 'auth.ts should have an update hook for users');
	assert.deepEqual(await update({ role: 'admin', name: 'Ana' } as never), { data: { name: 'Ana' } });
});

test("profiles: an admin's profile never opens for anyone", () => {
	assert.equal(canSeeProfile('job_seeker', 'admin'), false);
	assert.equal(canSeeProfile('recruiter', 'admin'), false);
});
