import { error, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { LIMITS } from '$lib/profile-options';
import { aiConfigured, aiErrorMessage, aiIsLocal, askJson, resumeText } from '$lib/server/ai';
import { db } from '$lib/server/db';
import { education, experience, profile, resume } from '$lib/server/db/schema';
import { loadEntries } from '$lib/server/profile-data';
import {
	EXTRACT_SCHEMA,
	EXTRACT_SYSTEM,
	normalizeParsed,
	PROFILE_FIELDS,
	resumePrompt,
	type ParsedEducation,
	type ParsedExperience
} from '$lib/server/resume-ai';
import { findOwnResume } from '$lib/server/resumes';
import type { Actions, PageServerLoad } from './$types';

const same = (a: string | null | undefined, b: string | null | undefined) =>
	(a ?? '').trim().toLowerCase() === (b ?? '').trim().toLowerCase();

// which parsed entries are already on the profile, so the same job isn't added twice
async function duplicates(userId: string, parsed: { experience: ParsedExperience[]; education: ParsedEducation[] }) {
	const existing = await loadEntries(userId);
	return {
		experience: parsed.experience.map((p) =>
			existing.experience.some((e) => same(e.title, p.title) && same(e.company, p.company) && e.startDate === p.startDate)
		),
		education: parsed.education.map((p) =>
			existing.education.some((e) => same(e.school, p.school) && same(e.degree, p.degree))
		)
	};
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const row = await findOwnResume(params.id, locals.user!.id);
	if (!row) error(404, 'Resume not found');
	return {
		resume: { id: row.id, fileName: row.fileName, parsed: row.parsed },
		duplicates: row.parsed ? await duplicates(locals.user!.id, row.parsed) : null,
		ai: { configured: aiConfigured(), local: aiIsLocal() }
	};
};

export const actions: Actions = {
	// reads the PDF with the AI model and saves what it found; nothing touches the profile yet
	extract: async ({ params, locals }) => {
		const row = await findOwnResume(params.id, locals.user!.id);
		if (!row) return fail(404, { error: 'That resume no longer exists.' });
		if (!aiConfigured()) return fail(503, { error: 'AI features aren’t set up on this server.' });

		const source = await resumeText(row.storagePath);
		if ('error' in source) return fail(400, { error: source.error });

		try {
			const raw = await askJson({
				system: EXTRACT_SYSTEM,
				user: resumePrompt(source.text),
				schemaName: 'resume_profile',
				schema: EXTRACT_SCHEMA
			});
			await db.update(resume).set({ parsed: normalizeParsed(raw), parsedAt: new Date() }).where(eq(resume.id, row.id));
		} catch (e) {
			return fail(502, { error: aiErrorMessage(e) });
		}
		return { done: true };
	},

	// copies the ticked items into the profile. The data comes from what the server saved in `extract`
	// (already validated); the form only says which items, by name or position.
	import: async ({ request, params, locals }) => {
		const userId = locals.user!.id;
		const row = await findOwnResume(params.id, userId);
		if (!row?.parsed) return fail(400, { error: 'Read the resume first.' });
		const parsed = row.parsed;
		const data = await request.formData();

		const fields = Object.fromEntries(
			PROFILE_FIELDS.filter((f) => data.getAll('field').includes(f) && parsed.profile[f]).map((f) => [f, parsed.profile[f]])
		);
		const picked = <T>(name: string, list: T[], taken: boolean[]) =>
			list.filter((_, i) => data.getAll(name).includes(String(i)) && !taken[i]);
		const taken = await duplicates(userId, parsed);
		const newExperience = picked('experience', parsed.experience, taken.experience);
		const newEducation = picked('education', parsed.education, taken.education);
		const addSkills = data.get('skills') === 'on' && parsed.skills.length > 0;

		if (!Object.keys(fields).length && !newExperience.length && !newEducation.length && !addSkills) {
			return fail(400, { error: 'Tick at least one item to add.' });
		}

		await db.transaction(async (tx) => {
			const set: Partial<typeof profile.$inferInsert> = { ...fields };
			if (addSkills) {
				const [current] = await tx.select({ skills: profile.skills }).from(profile).where(eq(profile.userId, userId));
				const merged = [...(current?.skills ?? [])];
				for (const skill of parsed.skills) if (!merged.some((s) => same(s, skill))) merged.push(skill);
				set.skills = merged.slice(0, LIMITS.skills);
			}
			if (Object.keys(set).length) {
				await tx
					.insert(profile)
					.values({ userId, ...set })
					.onConflictDoUpdate({ target: profile.userId, set: { ...set, updatedAt: new Date() } });
			}
			if (newExperience.length) await tx.insert(experience).values(newExperience.map((e) => ({ userId, ...e })));
			if (newEducation.length) await tx.insert(education).values(newEducation.map((e) => ({ userId, ...e })));
		});

		redirect(303, '/profile?saved');
	}
};
