import { env } from '$env/dynamic/private';
import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';

export const auth = betterAuth({
	baseURL: env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'pg' }),
	emailAndPassword: { enabled: true },
	user: {
		// US-04: no email sending set up yet, so unverified users can change email directly
		changeEmail: { enabled: true, updateEmailWithoutVerification: true },
		// the profile page always sends the password, so no email confirmation is needed
		deleteUser: { enabled: true },
		additionalFields: {
			// allowed values enforced by the user_role_check constraint in the DB
			role: { type: ['job_seeker', 'recruiter'], required: true, input: true },
			// US-11: set by the onboarding actions only (input: false)
			onboardedAt: { type: 'date', required: false, input: false }
		}
	},
	plugins: [
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
	]
});
