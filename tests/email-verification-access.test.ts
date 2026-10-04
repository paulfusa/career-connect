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

test('public authentication routes are accessible', () => {
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

test('guest users are redirected to login', () => {
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

test('unverified users are redirected to verification page', () => {
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

test('verified users can access protected pages', () => {
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