import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { jobPosting } from '$lib/server/db/schema';
import { parseJobPosting } from '$lib/server/job-posting';
import type { Actions, PageServerLoad } from './$types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const load: PageServerLoad = async ({ params, locals }) => {
	if (locals.user!.role !== 'recruiter') error(404, 'Job posting not found.');
	if (!UUID.test(params.id)) error(404, 'Job posting not found.');

	const [posting] = await db
		.select()
		.from(jobPosting)
		.where(and(eq(jobPosting.id, params.id), eq(jobPosting.createdBy, locals.user!.id)));
	if (!posting) error(404, 'Job posting not found.');
	return { posting };
};

export const actions: Actions = {
	save: async ({ request, params, locals }) => {
		if (locals.user!.role !== 'recruiter') return fail(403, { message: 'Only recruiters can edit job postings.' });
		if (!UUID.test(params.id)) return fail(404, { message: 'Job posting not found.' });

		const parsed = parseJobPosting(await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors, values: parsed.values });

		const [posting] = await db
			.update(jobPosting)
			.set({ ...parsed.values, updatedAt: new Date() })
			.where(and(eq(jobPosting.id, params.id), eq(jobPosting.createdBy, locals.user!.id)))
			.returning({ id: jobPosting.id });
		if (!posting) return fail(404, { message: 'Job posting not found.' });
		redirect(303, `/jobs/${posting.id}?saved=1`);
	},

	delete: async ({ params, locals }) => {
		if (locals.user!.role !== 'recruiter') return fail(403, { message: 'Only recruiters can delete job postings.' });
		if (!UUID.test(params.id)) return fail(404, { message: 'Job posting not found.' });

		const [posting] = await db
			.delete(jobPosting)
			.where(and(eq(jobPosting.id, params.id), eq(jobPosting.createdBy, locals.user!.id)))
			.returning({ id: jobPosting.id });
		if (!posting) return fail(404, { message: 'Job posting not found.' });
		redirect(303, '/jobs?mine');
	}
};
