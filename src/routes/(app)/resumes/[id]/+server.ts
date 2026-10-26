import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { application, jobPosting, resume } from '$lib/server/db/schema';
import { downloadResume } from '$lib/server/storage';
import type { RequestHandler } from './$types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Serves a resume PDF from the private bucket, only to its owner.
// ponytail: owner-only for now; let a recruiter through here once job applications link a resume to a posting
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!UUID.test(params.id)) error(404, 'Resume not found');
	const me = locals.user!;

	const [row] = await db
		.select()
		.from(resume)
		.where(eq(resume.id, params.id));

	if (!row) error(404, 'Resume not found');

	const isOwner = row.userId === me.id;

	if (!isOwner) {
		if (me.role !== 'recruiter') {
			error(404, 'Resume not found');
		}

		// The recruiter must own a job to which this resume was submitted.
		const [authorizedApplication] = await db
			.select({ id: application.id })
			.from(application)
			.innerJoin(
				jobPosting,
				eq(application.jobPostingId, jobPosting.id)
			)
			.where(
				and(
					eq(application.resumeId, row.id),
					eq(application.userId, row.userId),
					eq(jobPosting.createdBy, me.id)
				)
			)
			.limit(1);

		if (!authorizedApplication) {
			error(404, 'Resume not found');
		}
	}


	const file = await downloadResume(row.storagePath);
	if (!file) error(404, 'Resume not found');

	return new Response(file.body, {
		headers: {
			'content-type': 'application/pdf',
			'content-disposition': `inline; filename*=UTF-8''${encodeURIComponent(row.fileName)}`,
			'cache-control': 'private, no-store',
			'x-content-type-options': 'nosniff'
		}
	});
};
