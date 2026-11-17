import { env } from '$env/dynamic/private';
import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { building } from '$app/environment';
import { db } from '$lib/server/db';
import {
	sendVerificationEmail,
	sendPasswordResetCode
} from '$lib/server/email';
import { emailOTP } from 'better-auth/plugins';
import { allowedAtSignUp, withoutRoleChange } from '$lib/server/role-guard';

export const auth = betterAuth({
	baseURL: env.ORIGIN,
	// `vite build` loads this module with no .env (e.g. in CI); better-auth still refuses to run without a real secret
	secret: env.BETTER_AUTH_SECRET ?? (building ? 'build-time-placeholder-not-used-at-runtime' : undefined),
	database: drizzleAdapter(db, { provider: 'pg' }),
	emailAndPassword: { enabled: true,
		requireEmailVerification: true,
		autoSignIn: false
	 },

	 emailVerification: {
		sendOnSignUp: true,
		autoSignInAfterVerification: false,
		expiresIn: 60 * 60,

		sendVerificationEmail: async ({ user, url }) => {
			await sendVerificationEmail({
				to: user.email,
				verificationUrl: url
			});
		}
	},
	user: {
		// US-04: no email sending set up yet, so unverified users can change email directly
		changeEmail: { enabled: true, updateEmailWithoutVerification: true },
		// the profile page always sends the password, so no email confirmation is needed
		deleteUser: { enabled: true },
		additionalFields: {
			// allowed values enforced by the user_role_check constraint in the DB.
			// US-06: admin is only given with SQL in Supabase, the hooks below stop anyone setting it
			role: { type: ['job_seeker', 'recruiter', 'admin'], required: true, input: true },
			// US-11: set by the onboarding actions only (input: false)
			onboardedAt: { type: 'date', required: false, input: false }
		}
	},
	databaseHooks: {
		user: {
			// sign-up only accepts job_seeker or recruiter, even when someone calls the API directly
			create: { before: async (user) => allowedAtSignUp(user) },
			// nobody can change their own role after signing up
			update: { before: async (data) => ({ data: withoutRoleChange(data) }) }
		}
	},
	plugins: [
	emailOTP({
		otpLength: 6,
		expiresIn: 600,
		allowedAttempts: 5,
		resendStrategy: 'rotate',

		async sendVerificationOTP({ email, otp, type }) {
			if (type === 'forget-password') {
				await sendPasswordResetCode(email, otp);
			}
		}
	}),

	sveltekitCookies(getRequestEvent)
]
});
