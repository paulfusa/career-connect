import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { jobPosting } from '$lib/server/db/schema';
import { editJobPosting } from '$lib/server/job-posting-edit';
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
	return {posting: {
					id: posting.id,
					createdBy: posting.createdBy,
					title: posting.title,
					company: posting.company,
					companyDomain: posting.companyDomain,
					location: posting.location,
					employmentType: posting.employmentType,
					workMode: posting.workMode,
					description: posting.description,
					status: posting.status,
					published: posting.published,
					requirements: posting.requirements ?? '',
					applicationDeadline: posting.applicationDeadline ?? '',
					salaryMin: posting.salaryMin,
					salaryMax: posting.salaryMax,
					createdAt: posting.createdAt,
					updatedAt: posting.updatedAt
		}
	};
};

export const actions: Actions = {
	save: async ({ request, params, locals }) => {
		const result = await editJobPosting(
			locals.user!,
			params.id,
			await request.formData(),
			async (id, ownerId, values) => {
				const [posting] = await db
					.update(jobPosting)
					.set(values)
					.where(and(eq(jobPosting.id, id), eq(jobPosting.createdBy, ownerId)))
					.returning({ id: jobPosting.id });
				return posting?.id ?? null;
			}
		);

		if (result.status === 'forbidden') {
			return fail(403, { message: 'Only recruiters can edit job postings.' });
		}
		if (result.status === 'not-found') return fail(404, { message: 'Job posting not found.' });
		if (result.status === 'invalid') {
			return fail(400, { errors: result.errors, values: result.values });
		}
		redirect(303, `/jobs/${result.id}?saved=1`);
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
