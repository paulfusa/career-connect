import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { auth } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.user) {
		redirect(302, '/');
	}

	return {
		verified: url.searchParams.get('verified') === '1'
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();

		const email = data.get('email')?.toString().trim().toLowerCase() ?? '';
		const password = data.get('password')?.toString() ?? '';

		if (!email || !password) {
			return fail(400, {
				email,
				message: 'Enter your email and password.'
			});
		}

		try {
			await auth.api.signInEmail({
				body: {
					email,
					password
				}
			});
		} catch (error) {
			// US-02: wrong credentials get a generic message,
			// never reveal which field was wrong
			if (error instanceof APIError) {
				return fail(400, {
					email,
					message: 'Email or password is incorrect.'
				});
			}

			return fail(500, {
				email,
				message: 'Something went wrong on our side. Try again in a moment.'
			});
		}

		redirect(302, '/');
	}
};