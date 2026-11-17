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
			// allowed values enforced by the user_role_check constraint in the DB
			role: { type: ['job_seeker', 'recruiter'], required: true, input: true },
			// US-11: set by the onboarding actions only (input: false)
			onboardedAt: { type: 'date', required: false, input: false },
			// US-06: team members who review feature suggestions. input: false means nobody can set it at sign-up
			// or through update-user; it's only turned on with SQL in Supabase
			isAdmin: { type: 'boolean', required: false, defaultValue: false, input: false }
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
