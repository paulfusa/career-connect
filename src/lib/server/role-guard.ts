// US-06: admin can't be picked at sign-up, and nobody can change their role through Better Auth's
// update-user API. Admins are only made with SQL in Supabase
export const SIGN_UP_ROLES = ['job_seeker', 'recruiter'] as const;

// create hook: false means the account isn't created
export const allowedAtSignUp = (user: Record<string, unknown>): boolean =>
	typeof user.role === 'string' && (SIGN_UP_ROLES as readonly string[]).includes(user.role);

// update hook: takes the role out and keeps the rest
export function withoutRoleChange<T extends Record<string, unknown>>(data: T): Omit<T, 'role'> {
	const copy: Record<string, unknown> = { ...data };
	delete copy.role;
	return copy as Omit<T, 'role'>;
}
