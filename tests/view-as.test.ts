import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { isHttpError, isRedirect } from '@sveltejs/kit';

// US-06: admin role, the View as switch, and the sign-up/update role checks
registerHooks({
	resolve(specifier, context, next) {
		if (specifier.startsWith('$lib/')) {
			return { url: new URL(`../src/lib/${specifier.slice(5)}.ts`, import.meta.url).href, shortCircuit: true };
		}
		return next(specifier, context);
	}
});

const { viewAs, VIEW_AS_COOKIE } = await import('../src/lib/server/view-as.ts');
const { allowedAtSignUp, withoutRoleChange } = await import('../src/lib/server/role-guard.ts');
const endpoint = await import('../src/routes/(app)/view-as/+server.ts');

const admin = { id: 'admin-1', role: 'admin' };
const seeker = { id: 'seeker-1', role: 'job_seeker' };
const recruiter = { id: 'recruiter-1', role: 'recruiter' };

test('admin role: an admin uses the app as a job seeker until they pick recruiter', () => {
	assert.deepEqual(viewAs(admin, undefined), { id: 'admin-1', role: 'job_seeker', isAdmin: true });
	assert.deepEqual(viewAs(admin, 'recruiter'), { id: 'admin-1', role: 'recruiter', isAdmin: true });
	// doesn't change the session user
	assert.equal(admin.role, 'admin');
});

test('admin role: a made-up view falls back to job seeker', () => {
	assert.equal(viewAs(admin, 'admin').role, 'job_seeker');
	assert.equal(viewAs(admin, '').role, 'job_seeker');
});

test("admin role: job seekers and recruiters keep their role and aren't admins, whatever the cookie says", () => {
	assert.deepEqual(viewAs(seeker, 'recruiter'), { id: 'seeker-1', role: 'job_seeker', isAdmin: false });
	assert.deepEqual(viewAs(recruiter, 'job_seeker'), { id: 'recruiter-1', role: 'recruiter', isAdmin: false });
});

test('sign-up: only job seeker and recruiter accounts can be created', () => {
	assert.equal(allowedAtSignUp({ role: 'job_seeker' }), true);
	assert.equal(allowedAtSignUp({ role: 'recruiter' }), true);
	assert.equal(allowedAtSignUp({ role: 'admin' }), false);
	assert.equal(allowedAtSignUp({}), false);
});

test('update-user: a role change is dropped, the rest of the update goes through', () => {
	assert.deepEqual(withoutRoleChange({ role: 'admin', name: 'Ana' }), { name: 'Ana' });
	assert.deepEqual(withoutRoleChange({ role: 'recruiter' }), {});
	assert.deepEqual(withoutRoleChange({ emailVerified: true }), { emailVerified: true });
});

type Cookie = { name: string; value: string; options: Record<string, unknown> };

// locals.user like hooks.server.ts would set it
async function pick(me: { role: string } | undefined, role: string) {
	const set: Cookie[] = [];
	const body = new FormData();
	body.set('role', role);
	const event = {
		locals: { user: me && viewAs(me, undefined) },
		request: new Request('http://localhost/view-as', { method: 'POST', body }),
		cookies: { set: (name: string, value: string, options: Record<string, unknown>) => set.push({ name, value, options }) }
	};
	try {
		await endpoint.POST(event as never);
		return { set, thrown: null as unknown };
	} catch (thrown) {
		return { set, thrown };
	}
}

test('switch: an admin can pick a view, and is sent back to Home', async () => {
	const { set, thrown } = await pick(admin, 'recruiter');
	assert.ok(isRedirect(thrown) && thrown.location === '/');
	assert.equal(set.length, 1);
	assert.equal(set[0].name, VIEW_AS_COOKIE);
	assert.equal(set[0].value, 'recruiter');
	assert.equal(set[0].options.httpOnly, true);
	assert.equal(set[0].options.path, '/');
});

test("switch: someone who isn't an admin gets a not found page and no cookie", async () => {
	for (const me of [seeker, recruiter, undefined]) {
		const { set, thrown } = await pick(me, 'recruiter');
		assert.ok(isHttpError(thrown, 404));
		assert.equal(set.length, 0);
	}
});

test('switch: an unknown view is refused', async () => {
	const { set, thrown } = await pick(admin, 'admin');
	assert.ok(isHttpError(thrown, 400));
	assert.equal(set.length, 0);
});
