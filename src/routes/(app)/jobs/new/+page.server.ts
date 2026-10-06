import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { jobPosting } from '$lib/server/db/schema';
import { parseJobPosting } from '$lib/server/job-posting';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user!.role !== 'recruiter') error(403, 'Only recruiters can create job postings.');
	return {};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (locals.user!.role !== 'recruiter') return fail(403, { message: 'Only recruiters can create job postings.' });

		const parsed = parseJobPosting(await request.formData());
		if (!parsed.ok) return fail(400, { errors: parsed.errors, values: parsed.values });

		const [posting] = await db
			.insert(jobPosting)
			.values({ ...parsed.values, createdBy: locals.user!.id })
			.returning({ id: jobPosting.id });
		redirect(303, `/jobs/${posting.id}`);
	}
};
