import type { auth } from '$lib/server/auth';

type AuthSession = typeof auth.$Infer.Session;

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			// US-06: admins get the view they picked (see hooks.server.ts)
			user?: Omit<AuthSession['user'], 'role'> & { role: 'job_seeker' | 'recruiter'; isAdmin: boolean };
			session?: AuthSession['session'];
		}

		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
