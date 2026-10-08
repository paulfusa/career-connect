import { redirect, type Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';

// Public routes that do not require a verified account
const PUBLIC_PATHS = [
	'/login',
	'/register',
	'/verify-email',
	'/forgot-password',
	'/reset-password',
	'/verification-sent',
	'/api/auth'
];

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	const { pathname } = event.url;

	const isPublic = PUBLIC_PATHS.some(
		(path) =>
			pathname === path ||
			pathname.startsWith(`${path}/`)
	);

	if (!building && !isPublic) {
		// User is not logged in
		if (!session) {
			redirect(303, '/login');
		}

		// User is logged in but has not verified their email
		if (!session.user.emailVerified) {
			const email = encodeURIComponent(session.user.email);

			redirect(
				303,
				`/verify-email?email=${email}`
			);
		}
	}

	return svelteKitHandler({
		event,
		resolve,
		auth,
		building
	});
};

export const handle: Handle = handleBetterAuth;