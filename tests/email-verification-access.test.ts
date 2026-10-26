import test from 'node:test';
import assert from 'node:assert/strict';

function getProtectedRouteRedirect({
	pathname,
	building,
	hasSession,
	emailVerified,
	email
}: {
	pathname: string;
	building: boolean;
	hasSession: boolean;
	emailVerified: boolean;
	email?: string;
}) {
	const publicPaths = [
		'/login',
		'/register',
		'/verify-email',
		'/verification-sent',
		'/api/auth'
	];

	const isPublic = publicPaths.some(
		(path) =>
			pathname === path ||
			pathname.startsWith(`${path}/`)
	);

	if (building || isPublic) {
		return null;
	}

	if (!hasSession) {
		return '/login';
	}

	if (!emailVerified) {
		return `/verify-email?email=${encodeURIComponent(email ?? '')}`;
	}

	return null;
}

test('email verification: the sign-up and login pages stay public', () => {
	assert.equal(
		getProtectedRouteRedirect({
			pathname: '/login',
			building: false,
			hasSession: false,
			emailVerified: false
		}),
		null
	);

	assert.equal(
		getProtectedRouteRedirect({
			pathname: '/verification-sent',
			building: false,
			hasSession: false,
			emailVerified: false
		}),
		null
	);
});

test('email verification: guests are sent to the login page', () => {
	assert.equal(
		getProtectedRouteRedirect({
			pathname: '/',
			building: false,
			hasSession: false,
			emailVerified: false
		}),
		'/login'
	);
});

test('email verification: unverified users are sent to the verification page', () => {
	assert.equal(
		getProtectedRouteRedirect({
			pathname: '/',
			building: false,
			hasSession: true,
			emailVerified: false,
			email: 'test@example.com'
		}),
		'/verify-email?email=test%40example.com'
	);
});

test('email verification: verified users can reach protected pages', () => {
	assert.equal(
		getProtectedRouteRedirect({
			pathname: '/',
			building: false,
			hasSession: true,
			emailVerified: true,
			email: 'test@example.com'
		}),
		null
	);
});