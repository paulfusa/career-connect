import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { isHttpError, isRedirect } from '@sveltejs/kit';

// US-06: the admin "View as" switch. Tests the rule hooks.server.ts applies, and the switch's endpoint
registerHooks({
	resolve(specifier, context, next) {
		if (specifier.startsWith('$lib/')) {
			return { url: new URL(`../src/lib/${specifier.slice(5)}.ts`, import.meta.url).href, shortCircuit: true };
		}
		return next(specifier, context);
	}
});

const { applyViewAs, VIEW_AS_COOKIE } = await import('../src/lib/server/view-as.ts');
const endpoint = await import('../src/routes/(app)/view-as/+server.ts');

const admin = { id: 'admin-1', role: 'job_seeker', isAdmin: true };
const seeker = { id: 'seeker-1', role: 'job_seeker', isAdmin: false };

test('view as: an admin who picked recruiter is treated as a recruiter', () => {
	const viewed = applyViewAs(admin, 'recruiter');
	assert.equal(viewed.role, 'recruiter');
	assert.equal(viewed.isAdmin, true);
	// the session's user object isn't changed, only the copy used for this request
	assert.equal(admin.role, 'job_seeker');
});

test("view as: the cookie does nothing for someone who isn't an admin", () => {
	assert.equal(applyViewAs(seeker, 'recruiter'), seeker);
	assert.equal(applyViewAs({ ...seeker, isAdmin: null }, 'recruiter').role, 'job_seeker');
});

test('view as: only job seeker or recruiter can be picked', () => {
	assert.equal(applyViewAs(admin, 'admin').role, 'job_seeker');
	assert.equal(applyViewAs(admin, '').role, 'job_seeker');
	assert.equal(applyViewAs(admin, undefined), admin);
});

type Cookie = { name: string; value: string; options: Record<string, unknown> };

async function pick(me: object | undefined, role: string) {
	const set: Cookie[] = [];
	const body = new FormData();
	body.set('role', role);
	const event = {
		locals: { user: me },
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
	for (const me of [seeker, undefined]) {
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
