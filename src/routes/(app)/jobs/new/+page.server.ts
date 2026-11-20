import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { jobPosting } from '$lib/server/db/schema';
import { createJobPosting } from '$lib/server/job-posting-create';
import { yourCompanies } from '$lib/server/company-reviews-db';
import { checkJobCompany } from '$lib/server/job-company';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user!.role !== 'recruiter') error(403, 'Only recruiters can create job postings.');
	// US-09: the company is picked from your companies
	return { companies: (await yourCompanies(locals.user!.id)).map((company) => company.name) };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const form = await request.formData();
		// US-09: only for one of your companies
		const wrongCompany = locals.user!.role === 'recruiter' ? await checkJobCompany(locals.user!.id, form) : null;
		if (wrongCompany) return fail(400, wrongCompany);

		const result = await createJobPosting(locals.user!, form, async (values) => {
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
