import { error, redirect } from '@sveltejs/kit';
import { isViewAsRole, VIEW_AS_COOKIE } from '$lib/server/view-as';
import type { RequestHandler } from './$types';

// US-06: the View as switch (admins only)
export const POST: RequestHandler = async ({ request, locals, cookies }) => {
	if (locals.user?.isAdmin !== true) error(404, 'Not found');

	const role = (await request.formData()).get('role');
	if (!isViewAsRole(role)) error(400, 'Pick job seeker or recruiter.');

	cookies.set(VIEW_AS_COOKIE, role, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 });
	// go home, the current page might not exist in the other view (e.g. Resumes)
	redirect(303, '/');
};
