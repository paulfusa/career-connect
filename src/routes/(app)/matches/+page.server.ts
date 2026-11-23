import { error, fail } from '@sveltejs/kit';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { aiConfigured, aiErrorMessage, aiIsLocal, aiModel, askJson, resumeText } from '$lib/server/ai';
import { todayEastern } from '$lib/server/application';
import { db } from '$lib/server/db';
import { application, jobMatch, jobPosting, profile, resume } from '$lib/server/db/schema';
import { canMatch, isMatchable, MATCH_SCHEMA, MATCH_SYSTEM, matchPrompt, normalizeMatches, shortlist } from '$lib/server/job-match';
import { loadEntries } from '$lib/server/profile-data';
import { findOwnResume } from '$lib/server/resumes';
import type { Actions, PageServerLoad } from './$types';

// Access control: everything is read and saved by locals.user.id, so nobody can see another person's matches.

const appliedTo = async (userId: string) =>
	new Set(
		(await db.select({ jobId: application.jobPostingId }).from(application).where(eq(application.userId, userId))).map((a) => a.jobId)
	);

export const load: PageServerLoad = async ({ locals }) => {
	const me = locals.user!;
	if (me.role !== 'job_seeker') error(404, 'Not found');

	const [[saved], resumes] = await Promise.all([
		db.select().from(jobMatch).where(eq(jobMatch.userId, me.id)),
		db.select({ id: resume.id, fileName: resume.fileName }).from(resume).where(eq(resume.userId, me.id)).orderBy(desc(resume.updatedAt))
	]);

	// saved matches are re-checked, so a job that closed or that you applied to since then disappears
	const ids = saved?.matches.map((m) => m.jobId) ?? [];
	const jobs = ids.length ? await db.select().from(jobPosting).where(inArray(jobPosting.id, ids)) : [];
	const applied = await appliedTo(me.id);
	const today = todayEastern();
	const matches = (saved?.matches ?? []).flatMap((match) => {
		const job = jobs.find((j) => j.id === match.jobId);
		if (!job || !isMatchable(job, me.id, applied, today)) return [];
		const { id, title, company, companyDomain, location, employmentType, workMode } = job;
		return [{ ...match, job: { id, title, company, companyDomain, location, employmentType, workMode } }];
	});

	return {
		matches,
		saved: saved ? { resumeId: saved.resumeId, model: saved.model, updatedAt: saved.updatedAt } : null,
		resumes,
		ai: { configured: aiConfigured(), local: aiIsLocal() }
	};
};

export const actions: Actions = {
	run: async ({ request, locals }) => {
		const me = locals.user!;
		if (me.role !== 'job_seeker') return fail(403, { error: 'Only job seekers can get job matches.' });
		if (!aiConfigured()) return fail(503, { error: 'AI features aren’t set up on this server.' });

		const resumeId = (await request.formData()).get('resumeId')?.toString() ?? '';
		const chosen = resumeId ? await findOwnResume(resumeId, me.id) : null;
		if (resumeId && !chosen) return fail(404, { error: 'That resume no longer exists.' });

		const [[details], entries] = await Promise.all([
			db.select().from(profile).where(eq(profile.userId, me.id)),
			loadEntries(me.id)
		]);
		const candidate = {
			headline: details?.headline,
			about: details?.about,
			skills: details?.skills ?? [],
			desiredRoles: details?.desiredRoles ?? [],
			jobTypes: details?.jobTypes ?? [],
			workModes: details?.workModes ?? [],
			preferredLocations: details?.preferredLocations ?? [],
			...entries
		};
		if (!canMatch(candidate, !!chosen)) {
			return fail(400, { emptyProfile: true, error: 'Your profile doesn’t have enough to match yet. Add at least 3 skills or an experience, or choose a resume.' });
		}

		let text: string | null = null;
		if (chosen) {
			const source = await resumeText(chosen.storagePath);
			if ('error' in source) return fail(400, { error: source.error });
			text = source.text;
		}

		const applied = await appliedTo(me.id);
		const today = todayEastern();
		// ponytail: newest 200 postings; filter in SQL if the board ever grows past that
		const postings = await db
			.select()
			.from(jobPosting)
			.where(and(eq(jobPosting.published, true), eq(jobPosting.archived, false), eq(jobPosting.status, 'open')))
			.orderBy(desc(jobPosting.createdAt))
			.limit(200);
		const jobs = shortlist(postings.filter((j) => isMatchable(j, me.id, applied, today)), candidate, text ?? '');

		try {
			const matches = jobs.length
				? normalizeMatches(
						await askJson({ system: MATCH_SYSTEM, user: matchPrompt(candidate, text, jobs), schemaName: 'job_matches', schema: MATCH_SCHEMA }),
						jobs,
						candidate.skills
					)
				: [];
			const values = { resumeId: chosen?.id ?? null, matches, model: aiModel(), updatedAt: new Date() };
			await db.insert(jobMatch).values({ userId: me.id, ...values }).onConflictDoUpdate({ target: jobMatch.userId, set: values });
		} catch (e) {
			return fail(502, { error: aiErrorMessage(e) });
		}
		return { done: true };
	}
};
