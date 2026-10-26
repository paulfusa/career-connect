import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { jobPosting } from '$lib/server/db/schema';
import { createJobPosting } from '$lib/server/job-posting-create';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user!.role !== 'recruiter') error(403, 'Only recruiters can create job postings.');
	return {};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const result = await createJobPosting(locals.user!, await request.formData(), async (values) => {
			const [posting] = await db
				.insert(jobPosting)
				.values(values)
				.returning({ id: jobPosting.id });
			return posting.id;
		});

		if (result.status === 'forbidden') {
			return fail(403, { message: 'Only recruiters can create job postings.' });
		}
		if (result.status === 'invalid') {
			return fail(400, { errors: result.errors, values: result.values });
		}
		redirect(303, `/jobs/${result.id}`);
	}
};
