import { error, fail } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import { aiConfigured, aiErrorMessage, aiIsLocal, aiModel, askJson, resumeText } from '$lib/server/ai';
import { db } from '$lib/server/db';
import { jobPosting, resume } from '$lib/server/db/schema';
import { normalizeReview, resumePrompt, REVIEW_SCHEMA, reviewSystem } from '$lib/server/resume-ai';
import { findOwnResume, UUID } from '$lib/server/resumes';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const row = await findOwnResume(params.id, locals.user!.id);
	if (!row) error(404, 'Resume not found');

	// postings the review can be tailored to
	const jobs = await db
		.select({ id: jobPosting.id, title: jobPosting.title, company: jobPosting.company })
		.from(jobPosting)
		.orderBy(desc(jobPosting.createdAt))
		.limit(50);

	return {
		resume: { id: row.id, fileName: row.fileName, review: row.review, reviewedAt: row.reviewedAt },
		jobs,
		ai: { configured: aiConfigured(), local: aiIsLocal() }
	};
};

export const actions: Actions = {
	run: async ({ request, params, locals }) => {
		const row = await findOwnResume(params.id, locals.user!.id);
		if (!row) return fail(404, { error: 'That resume no longer exists.' });
		if (!aiConfigured()) return fail(503, { error: 'AI features aren’t set up on this server.' });

		const jobId = (await request.formData()).get('jobId')?.toString() ?? '';
		const [job] = UUID.test(jobId) ? await db.select().from(jobPosting).where(eq(jobPosting.id, jobId)) : [];

		const source = await resumeText(row.storagePath);
		if ('error' in source) return fail(400, { error: source.error });

		try {
			const raw = await askJson({
				system: reviewSystem(job ?? null),
				user: resumePrompt(source.text),
				schemaName: 'resume_review',
				schema: REVIEW_SCHEMA
			});
			const review = {
				...normalizeReview(raw),
				job: job ? { id: job.id, title: job.title, company: job.company } : null,
				model: aiModel()
			};
			await db.update(resume).set({ review, reviewedAt: new Date() }).where(eq(resume.id, row.id));
		} catch (e) {
			return fail(502, { error: aiErrorMessage(e) });
		}
		return { done: true };
	}
};
