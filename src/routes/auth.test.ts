// Run with: pnpm test
// Tasks 1.4 + 2.4: signup, login and protected-route redirects, against the real
// actions and hook. SvelteKit aliases are swapped for fakes so no DB is needed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { isRedirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';

const fakes: Record<string, string> = {
	'$lib/server/auth': 'export const auth = globalThis.__fakeAuth;',
	'$app/environment': 'export const building = false;',
	'better-auth/svelte-kit': 'export const svelteKitHandler = ({ event, resolve }) => resolve(event);'
};
registerHooks({
	resolve: (specifier, context, next) =>
		specifier in fakes ? { url: `fake:${specifier}`, shortCircuit: true } : next(specifier, context),
	load: (url, context, next) =>
		url.startsWith('fake:') ? { format: 'module', source: fakes[url.slice(5)], shortCircuit: true } : next(url, context)
});

// ponytail: in-memory stand-in for better-auth, just enough to mimic its sign-up/sign-in errors
const users = new Map<string, string>();
let session: { session: object; user: { id: string } } | null = null;
(globalThis as any).__fakeAuth = {
	api: {
		signUpEmail: async ({ body }: { body: { email: string; password: string } }) => {
			if (users.has(body.email)) throw new APIError('UNPROCESSABLE_ENTITY', { message: 'User already exists. Use another email.' });
			users.set(body.email, body.password);
		},
		signInEmail: async ({ body }: { body: { email: string; password: string } }) => {
			if (users.get(body.email) !== body.password) throw new APIError('UNAUTHORIZED', { message: 'Invalid email or password' });
		},
		getSession: async () => session
	}
};

const { actions: registerActions } = await import('./register/+page.server.ts');
const { actions: loginActions, load: loginLoad } = await import('./login/+page.server.ts');
const { handle } = await import('../hooks.server.ts');

const post = (fields: Record<string, string>) => {
	const body = new FormData();
	for (const [k, v] of Object.entries(fields)) body.append(k, v);
	return { request: new Request('http://localhost/', { method: 'POST', body }) } as any;
};
// returns the redirect location, or the action's return value if it didn't redirect
const run = async (fn: () => unknown) => {
	try {
		return { result: await fn() } as any;
	} catch (e) {
		if (isRedirect(e)) return { status: e.status, location: e.location };
		throw e;
	}
};
const signup = { name: 'Ada', email: 'ada@example.com', password: 'correct-horse', role: 'job_seeker' };

// Task 1.4

test('signup: valid details create the account and redirect home', async () => {
	users.clear();
	const r = await run(() => registerActions.default(post(signup)));
	assert.deepEqual(r, { status: 302, location: '/' });
	assert.ok(users.has('ada@example.com'));
});

test('signup: duplicate email is rejected with a message and the form values kept', async () => {
	users.clear();
	users.set('ada@example.com', 'something-else');
	const { result } = await run(() => registerActions.default(post(signup)));
	assert.equal(result.status, 400);
	assert.match(result.data.message, /already exists/);
	assert.equal(result.data.email, 'ada@example.com');
	assert.equal(result.data.password, undefined, 'password must never be echoed back');
});

test('signup: weak password is rejected before an account is created', async () => {
	users.clear();
	const { result } = await run(() => registerActions.default(post({ ...signup, password: 'short' })));
	assert.equal(result.status, 400);
	assert.match(result.data.message, /at least 8 characters/);
	assert.equal(users.size, 0);
});

// Task 2.4

test('login: correct credentials redirect home', async () => {
	users.clear();
	users.set('ada@example.com', 'correct-horse');
	const r = await run(() => loginActions.default(post({ email: ' ada@example.com ', password: 'correct-horse' })));
	assert.deepEqual(r, { status: 302, location: '/' });
});

test('login: wrong password and unknown email get the same generic error', async () => {
	users.clear();
	users.set('ada@example.com', 'correct-horse');
	for (const creds of [
		{ email: 'ada@example.com', password: 'wrong-horse' },
		{ email: 'nobody@example.com', password: 'correct-horse' }
	]) {
		const { result } = await run(() => loginActions.default(post(creds)));
		assert.equal(result.status, 400);
		assert.equal(result.data.message, 'Email or password is incorrect.');
	}
});

test('login: empty fields are rejected without calling auth', async () => {
	const { result } = await run(() => loginActions.default(post({ email: '', password: '' })));
	assert.equal(result.status, 400);
	assert.match(result.data.message, /Enter your email and password/);
});

const visit = (path: string) => {
	const url = new URL(path, 'http://localhost');
	const event = { url, request: new Request(url), locals: {} as any };
	return run(() => handle({ event, resolve: async () => new Response('ok') } as any)).then((r) => ({ ...r, event }));
};

test('protected routes redirect guests to /login', async () => {
	session = null;
	for (const path of ['/', '/profile', '/logout', '/login-but-not-really']) {
		const r = await visit(path);
		assert.equal(r.status, 303, path);
		assert.equal(r.location, '/login', path);
	}
});

test('public routes stay reachable for guests', async () => {
	session = null;
	for (const path of ['/login', '/register', '/api/auth/sign-in/email']) {
		const r = await visit(path);
		assert.ok(r.result instanceof Response, path);
	}
});

test('signed-in users reach protected routes and get locals.user', async () => {
	session = { session: {}, user: { id: 'u1' } };
	const r = await visit('/profile');
	assert.ok(r.result instanceof Response);
	assert.equal(r.event.locals.user.id, 'u1');
	session = null;
});

test('signed-in users visiting /login are sent home', async () => {
	const r = await run(() => loginLoad({ locals: { user: { id: 'u1' } } } as any));
	assert.deepEqual(r, { status: 302, location: '/' });
});
