// US-06: admin is its own role, but the pages are built for job seekers and recruiters.
// So an admin always uses the app as one of the two (job seeker unless they picked recruiter with the
// "View as" switch), plus the admin pages. hooks.server.ts applies this to locals.user on every request,
// so the role checks in the rest of the app don't need to know about admins.
export const VIEW_AS_COOKIE = 'view_as';

export const VIEW_AS_ROLES = ['job_seeker', 'recruiter'] as const;
export type ViewAsRole = (typeof VIEW_AS_ROLES)[number];

export const isViewAsRole = (value: unknown): value is ViewAsRole =>
	typeof value === 'string' && (VIEW_AS_ROLES as readonly string[]).includes(value);

// the user the pages see: the role they use the app as, and whether they're an admin
export function viewAs<U extends { role: string }>(user: U, choice: string | undefined): Omit<U, 'role'> & { role: ViewAsRole; isAdmin: boolean } {
	if (user.role === 'admin') return { ...user, role: isViewAsRole(choice) ? choice : 'job_seeker', isAdmin: true };
	// job seekers and recruiters keep their own role, and the cookie is ignored
	return { ...user, role: isViewAsRole(user.role) ? user.role : 'job_seeker', isAdmin: false };
}
