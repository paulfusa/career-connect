// US-06: admins can switch between the job seeker and recruiter views with one account.
// The choice is kept in a cookie, and hooks.server.ts applies it to locals.user on every request,
// so every page and permission check follows the chosen view without changing them.
export const VIEW_AS_COOKIE = 'view_as';

export const VIEW_AS_ROLES = ['job_seeker', 'recruiter'] as const;
export type ViewAsRole = (typeof VIEW_AS_ROLES)[number];

export const isViewAsRole = (value: unknown): value is ViewAsRole =>
	typeof value === 'string' && (VIEW_AS_ROLES as readonly string[]).includes(value);

// only users with the admin flag can switch; for everyone else the cookie is ignored
export function applyViewAs<U extends { role: string; isAdmin?: boolean | null }>(user: U, choice: string | undefined): U {
	if (user.isAdmin !== true || !isViewAsRole(choice) || choice === user.role) return user;
	return { ...user, role: choice };
}
