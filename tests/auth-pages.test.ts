import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { APIError } from 'better-auth/api';
import { useFakes, resetFakes, fake, spy, event, run, seeker } from './helpers/fakes.ts';

// US-01, US-02, US-08, US-17: the sign-up, login, logout, email verification and password reset pages,
// with Better Auth faked (replaces the old src/routes/auth.test.ts, written before email verification)
useFakes();
const login = await import('../src/routes/login/+page.server.ts');
const register = await import('../src/routes/register/+page.server.ts');
const forgot = await import('../src/routes/forgot-password/+page.server.ts');
const reset = await import('../src/routes/reset-password/+page.server.ts');
const verify = await import('../src/routes/verify-email/+page.server.ts');
const verificationSent = await import('../src/routes/verification-sent/+page.server.ts');
const logout = await import('../src/routes/(app)/logout/+page.server.ts');
const { handle } = await import('../src/hooks.server.ts');

beforeEach(resetFakes);

const signUp = { name: 'Ana Tremblay', email: ' Ana@Example.com ', password: 'long-enough-1', role: 'job_seeker' };

test('register: a valid sign-up creates the account and goes to "check your email"', async () => {
	const signUpEmail = (fake.auth.api.signUpEmail = spy(async () => ({})));
	const r = await run(() => register.actions.default(event({ form: signUp })));
	assert.deepEqual(r, { kind: 'redirect', status: 303, location: '/verification-sent?email=ana%40example.com' });
	assert.deepEqual(signUpEmail.calls[0], [
		{ body: { name: 'Ana Tremblay', email: 'ana@example.com', password: 'long-enough-1', role: 'job_seeker', callbackURL: '/login?verified=1' } }
	]);
});

test('register: missing fields, short passwords and unknown roles are refused before Better Auth', async () => {
	const signUpEmail = (fake.auth.api.signUpEmail = spy(async () => ({})));
	const cases: [Record<string, string>, string][] = [
		[{ ...signUp, name: '' }, 'Fill in your name, email and password.'],
		[{ ...signUp, password: 'short' }, 'Use a password with at least 8 characters.'],
		[{ ...signUp, role: 'admin' }, 'Choose whether you are looking for a job or hiring.']
	];
	for (const [form, message] of cases) {
		const r = await run(() => register.actions.default(event({ form })));
		assert.equal(r.kind, 'fail');
		assert.equal(r.kind === 'fail' && r.data.message, message);
	}
	assert.equal(signUpEmail.calls.length, 0);
});

test("register: Better Auth's own errors are shown, anything else is a generic 500", async () => {
	fake.auth.api.signUpEmail = spy(async () => {
		throw new APIError('BAD_REQUEST', { message: 'Password is too common' });
	});
	let r = await run(() => register.actions.default(event({ form: signUp })));
	assert.deepEqual(r, { kind: 'fail', status: 400, data: { name: 'Ana Tremblay', email: 'ana@example.com', role: 'job_seeker', message: 'Password is too common' } });

	fake.auth.api.signUpEmail = spy(async () => {
		throw new Error('database down');
	});
	const errorLog = console.error;
	console.error = () => {};
	r = await run(() => register.actions.default(event({ form: signUp })));
	console.error = errorLog;
	assert.equal(r.kind === 'fail' && r.status, 500);
});

test('register and login pages send signed-in users home', async () => {
	assert.deepEqual(await run(() => register.load(event({ user: seeker }))), { kind: 'redirect', status: 302, location: '/' });
	assert.deepEqual(await run(() => login.load(event({ user: seeker }))), { kind: 'redirect', status: 302, location: '/' });
	// an unverified user stays on /login, or they'd bounce between / and /verify-email forever
	const unverified = { ...seeker, emailVerified: false };
	assert.deepEqual(await run(() => login.load(event({ user: unverified }))), { kind: 'ok', data: { verified: false } });
	assert.deepEqual(await run(() => login.load(event({ url: 'http://localhost/login?verified=1' }))), { kind: 'ok', data: { verified: true } });
});

test('login: correct credentials sign in and go home', async () => {
	const signInEmail = (fake.auth.api.signInEmail = spy(async () => ({})));
	const r = await run(() => login.actions.default(event({ form: { email: 'ANA@example.com', password: 'secret-pass' } })));
	assert.deepEqual(r, { kind: 'redirect', status: 302, location: '/' });
	assert.deepEqual(signInEmail.calls[0], [{ body: { email: 'ana@example.com', password: 'secret-pass' } }]);
});

test("login: wrong credentials get one generic message that doesn't say which field was wrong", async () => {
	fake.auth.api.signInEmail = spy(async () => {
		throw new APIError('UNAUTHORIZED', { message: 'Invalid password' });
	});
	const r = await run(() => login.actions.default(event({ form: { email: 'ana@example.com', password: 'wrong' } })));
	assert.deepEqual(r, { kind: 'fail', status: 400, data: { email: 'ana@example.com', message: 'Email or password is incorrect.' } });

	const empty = await run(() => login.actions.default(event({ form: { email: '', password: '' } })));
	assert.equal(empty.kind === 'fail' && empty.data.message, 'Enter your email and password.');

	fake.auth.api.signInEmail = spy(async () => {
		throw new Error('network');
	});
	const broken = await run(() => login.actions.default(event({ form: { email: 'ana@example.com', password: 'x' } })));
	assert.equal(broken.kind === 'fail' && broken.status, 500);
});

test('logout: ends the session and goes to the login page; visiting /logout just goes home', async () => {
	const signOut = (fake.auth.api.signOut = spy(async () => ({})));
	const e = event({ user: seeker, form: {} });
	assert.deepEqual(await run(() => logout.actions.default(e)), { kind: 'redirect', status: 303, location: '/login' });
	assert.equal(signOut.calls.length, 1);
	assert.deepEqual(await run(() => logout.load(event({ user: seeker }))), { kind: 'redirect', status: 303, location: '/' });
});

// the real hook in hooks.server.ts, with the session coming from the fake auth
async function visit(path: string, user?: object) {
	fake.auth.api.getSession = spy(async () => (user ? { session: { id: 's1' }, user } : null));
	const url = new URL(path, 'http://localhost');
	const e = { url, request: new Request(url), locals: {}, cookies: { get: () => undefined }, isSubRequest: false } as never;
	return run(() => handle({ event: e, resolve: async () => new Response('page') }));
}

test('hook: guests are sent to /login, except on the public pages', async () => {
	assert.deepEqual(await visit('/profile'), { kind: 'redirect', status: 303, location: '/login' });
	assert.deepEqual(await visit('/resumes/abc'), { kind: 'redirect', status: 303, location: '/login' });
	for (const path of ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password', '/verification-sent']) {
		const r = await visit(path);
		assert.equal(r.kind, 'ok', path);
	}
});

test('hook: unverified users are sent to verify their email; verified users get through', async () => {
	const r = await visit('/jobs', { ...seeker, emailVerified: false });
	assert.deepEqual(r, { kind: 'redirect', status: 303, location: '/verify-email?email=ana%40example.com' });
	assert.equal((await visit('/jobs', seeker)).kind, 'ok');
});

test('verify email: resending works without saying whether the account exists', async () => {
	const send = (fake.auth.api.sendVerificationEmail = spy(async () => ({})));
	const r = await run(() => verify.actions.resend(event({ form: { email: ' Ana@Example.com ' } })));
	assert.equal(r.kind === 'ok' && (r.data as { message: string }).message, 'If that address belongs to an unverified account, a new verification email has been sent.');
	assert.deepEqual(send.calls[0], [{ body: { email: 'ana@example.com', callbackURL: '/login?verified=1' } }]);

	const empty = await run(() => verify.actions.resend(event({ form: { email: '' } })));
	assert.equal(empty.kind === 'fail' && empty.status, 400);

	fake.auth.api.sendVerificationEmail = spy(async () => {
		throw new Error('email service down');
	});
	const errorLog = console.error;
	console.error = () => {};
	const failed = await run(() => verify.actions.resend(event({ form: { email: 'ana@example.com' } })));
	console.error = errorLog;
	assert.equal(failed.kind === 'fail' && failed.status, 500);

	assert.deepEqual(await verify.load(event({ url: 'http://localhost/verify-email?email=a%40b.c' })), { email: 'a@b.c' });
	assert.deepEqual(await verificationSent.load(event({ url: 'http://localhost/verification-sent' })), { email: '' });
});

test('forgot password: sends a code at most once a minute, with the same answer for every email', async () => {
	fake.env.BETTER_AUTH_SECRET = 'test-secret';
	const sendCode = (fake.auth.api.requestPasswordResetEmailOTP = spy(async () => ({})));
	const answer = { email: 'ana@example.com', message: 'If an account exists with this email, you will receive a reset code.' };

	fake.db.results.push([{ email_hash: 'x' }]); // the cooldown row was written: send
	assert.deepEqual(await run(() => forgot.actions.default(event({ form: { email: 'Ana@Example.com' } }))), { kind: 'ok', data: answer });
	fake.db.results.push([]); // still in the 60-second cooldown: don't send
	assert.deepEqual(await run(() => forgot.actions.default(event({ form: { email: 'ana@example.com' } }))), { kind: 'ok', data: answer });
	assert.equal(sendCode.calls.length, 1);

	// the email is stored as a keyed hash, never in plain text
	assert.ok(!fake.db.queries[0].params!.includes('ana@example.com'));
	assert.match(String(fake.db.queries[0].params![0]), /^[0-9a-f]{64}$/);
});

test('forgot password: an invalid email is refused, and a server problem still gives the same answer', async () => {
	const bad = await run(() => forgot.actions.default(event({ form: { email: 'not-an-email' } })));
	assert.deepEqual(bad, { kind: 'fail', status: 400, data: { email: 'not-an-email', error: 'Please enter a valid email address.' } });

	const errorLog = console.error;
	console.error = () => {};
	const noSecret = await run(() => forgot.actions.default(event({ form: { email: 'ana@example.com' } })));
	console.error = errorLog;
	assert.equal(noSecret.kind, 'ok');
	assert.equal(fake.db.queries.length, 0);
});

test('reset password: a valid code sets the new password and goes to login', async () => {
	const resetPassword = (fake.auth.api.resetPasswordEmailOTP = spy(async () => ({})));
	const form = { email: 'ana@example.com', otp: '123456', password: 'new-password', confirmPassword: 'new-password' };
	assert.deepEqual(await run(() => reset.actions.default(event({ form }))), { kind: 'redirect', status: 303, location: '/login?passwordReset=1' });
	assert.deepEqual(resetPassword.calls[0], [{ body: { email: 'ana@example.com', otp: '123456', password: 'new-password' } }]);

	const mismatch = await run(() => reset.actions.default(event({ form: { ...form, confirmPassword: 'other-password' } })));
	assert.equal(mismatch.kind === 'fail' && mismatch.data.error, 'Passwords do not match.');

	fake.auth.api.resetPasswordEmailOTP = spy(async () => {
		throw new APIError('BAD_REQUEST', { message: 'invalid otp' });
	});
	const errorLog = console.error;
	console.error = () => {};
	const wrongCode = await run(() => reset.actions.default(event({ form })));
	console.error = errorLog;
	assert.equal(wrongCode.kind === 'fail' && wrongCode.data.error, 'Invalid or expired reset code. Please request a new code if needed.');
});
