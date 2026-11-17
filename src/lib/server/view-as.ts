// US-06: admin is its own role, but the pages only know job seekers and recruiters.
// So an admin sees the app as one of them (job seeker unless they switched), plus the admin pages.
// hooks.server.ts runs this on every request
export const VIEW_AS_COOKIE = 'view_as';

export const VIEW_AS_ROLES = ['job_seeker', 'recruiter'] as const;
export type ViewAsRole = (typeof VIEW_AS_ROLES)[number];

export const isViewAsRole = (value: unknown): value is ViewAsRole =>
	typeof value === 'string' && (VIEW_AS_ROLES as readonly string[]).includes(value);

// what the pages get as locals.user
export function viewAs<U extends { role: string }>(user: U, choice: string | undefined): Omit<U, 'role'> & { role: ViewAsRole; isAdmin: boolean } {
	if (user.role === 'admin') return { ...user, role: isViewAsRole(choice) ? choice : 'job_seeker', isAdmin: true };
	// everyone else keeps their role and the cookie is ignored
	return { ...user, role: isViewAsRole(user.role) ? user.role : 'job_seeker', isAdmin: false };
}
