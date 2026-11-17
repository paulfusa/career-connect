// US-06: roles can only be job_seeker or recruiter at sign-up, and nobody can change their role
// through Better Auth's own API (POST /api/auth/update-user). Admins are only made with SQL in Supabase.
export const SIGN_UP_ROLES = ['job_seeker', 'recruiter'] as const;

// used for Better Auth's databaseHooks.user.create.before: false stops the account from being created
export const allowedAtSignUp = (user: Record<string, unknown>): boolean =>
	typeof user.role === 'string' && (SIGN_UP_ROLES as readonly string[]).includes(user.role);

// used for databaseHooks.user.update.before: drops any role change and keeps the rest of the update
export function withoutRoleChange<T extends Record<string, unknown>>(data: T): Omit<T, 'role'> {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars -- role is taken out on purpose
	const { role, ...rest } = data;
	return rest;
}
