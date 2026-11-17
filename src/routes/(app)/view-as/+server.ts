import { error, redirect } from '@sveltejs/kit';
import { isViewAsRole, VIEW_AS_COOKIE } from '$lib/server/view-as';
import type { RequestHandler } from './$types';

// US-06: the "View as" switch in the sidebar. Only admins can use it; everyone else gets a 404
export const POST: RequestHandler = async ({ request, locals, cookies }) => {
	if (locals.user?.isAdmin !== true) error(404, 'Not found');

	const role = (await request.formData()).get('role');
	if (!isViewAsRole(role)) error(400, 'Pick job seeker or recruiter.');

	cookies.set(VIEW_AS_COOKIE, role, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 });
	// back to Home, since the page you were on may only exist for the other role (like Resumes)
	redirect(303, '/');
};
