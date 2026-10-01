import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { auth } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

const ROLES = ['job_seeker', 'recruiter'] as const;
type Role = (typeof ROLES)[number];

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) {
		redirect(302, '/');
	}
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();

		const name = data.get('name')?.toString().trim() ?? '';
		const email = data.get('email')?.toString().trim().toLowerCase() ?? '';
		const password = data.get('password')?.toString() ?? '';
		const role = data.get('role')?.toString() ?? '';

		const values = {
			name,
			email,
			role
		};

		if (!name || !email || !password) {
			return fail(400, {
				...values,
				message: 'Fill in your name, email and password.'
			});
		}

		if (password.length < 8) {
			return fail(400, {
				...values,
				message: 'Use a password with at least 8 characters.'
			});
		}

		if (!ROLES.includes(role as Role)) {
			return fail(400, {
				...values,
				message: 'Choose whether you are looking for a job or hiring.'
			});
		}

		try {
			await auth.api.signUpEmail({
				body: {
					name,
					email,
					password,
					role: role as Role,
					callbackURL: '/login?verified=1'
				}
			});
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, {
					...values,
					message: error.message || 'Could not create your account.'
				});
			}

			console.error('Registration failed:', error);

			return fail(500, {
				...values,
				message: 'Something went wrong on our side. Try again in a moment.'
			});
		}

		redirect(
			303,
			`/verification-sent?email=${encodeURIComponent(email)}`
		);
	}
};