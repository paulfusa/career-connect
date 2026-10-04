import { fail } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	return {
		email: url.searchParams.get('email') ?? ''
	};
};

export const actions: Actions = {
	resend: async ({ request }) => {
		const formData = await request.formData();

		const email = String(formData.get('email') ?? '')
			.trim()
			.toLowerCase();

		if (!email) {
			return fail(400, {
				error: 'Please enter your email address.'
			});
		}

		try {
			await auth.api.sendVerificationEmail({
				body: {
					email,
					callbackURL: '/login?verified=1'
				}
			});

			return {
				success: true,
				message:
					'If that address belongs to an unverified account, a new verification email has been sent.'
			};
		} catch (error) {
			console.error('Failed to resend verification email:', error);

			return fail(500, {
				error: 'We could not send the verification email. Please try again.'
			});
		}
	}
};