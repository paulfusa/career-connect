import { error, fail } from '@sveltejs/kit';
import { and, count, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { resume } from '$lib/server/db/schema';
import { cleanFileName, RESUME_MAX_COUNT, validateResume } from '$lib/resume';
import { deleteResume, uploadResume } from '$lib/server/storage';
import type { Actions, PageServerLoad } from './$types';

// Access control: every query is scoped to locals.user.id, so users only ever see and change their own resumes.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user!.role !== 'job_seeker') error(404, 'Not found');
	const resumes = await db
		.select()
		.from(resume)
		.where(eq(resume.userId, locals.user!.id))
		.orderBy(desc(resume.updatedAt));
	return { resumes };
};

// the uploaded file, or an error message
async function readPdf(data: FormData): Promise<File | string> {
	const file = data.get('file');
	if (!(file instanceof File)) return 'Choose a PDF to upload.';
	const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
	return validateResume(file, head) ?? file;
}

async function ownResume(data: FormData, userId: string) {
	const id = data.get('id')?.toString() ?? '';
	if (!UUID.test(id)) return null;
	const [row] = await db.select().from(resume).where(and(eq(resume.id, id), eq(resume.userId, userId)));
	return row ?? null;
}

const storageFailed = (e: unknown) => {
	console.error(e);
	return fail(500, { error: 'The file could not be saved. Try again in a moment.' });
};

export const actions: Actions = {
	upload: async ({ request, locals }) => {
		const me = locals.user!;
		if (me.role !== 'job_seeker') return fail(403, { error: 'Only job seekers can upload resumes.' });

		const file = await readPdf(await request.formData());
		if (typeof file === 'string') return fail(400, { error: file });

		const [{ total }] = await db.select({ total: count() }).from(resume).where(eq(resume.userId, me.id));
		if (total >= RESUME_MAX_COUNT) {
			return fail(400, { error: `You can keep up to ${RESUME_MAX_COUNT} resumes. Delete one to upload another.` });
		}

		// the path never contains anything the user typed
		const id = crypto.randomUUID();
		const storagePath = `${me.id}/${id}.pdf`;
		const fileName = cleanFileName(file.name);
		try {
			await uploadResume(storagePath, file);
		} catch (e) {
			return storageFailed(e);
		}
		try {
			await db.insert(resume).values({ id, userId: me.id, fileName, sizeBytes: file.size, storagePath });
		} catch (e) {
			await deleteResume(storagePath).catch(console.error); // don't leave an orphan file
			throw e;
		}
		return { success: `${fileName} uploaded.` };
	},

	replace: async ({ request, locals }) => {
		const data = await request.formData();
		const row = await ownResume(data, locals.user!.id);
		if (!row) return fail(404, { error: 'That resume no longer exists.' });

		const file = await readPdf(data);
		if (typeof file === 'string') return fail(400, { error: file });

		const fileName = cleanFileName(file.name);
		try {
			await uploadResume(row.storagePath, file); // same path: overwrites the old file
		} catch (e) {
			return storageFailed(e);
		}
		await db
			.update(resume)
			.set({ fileName, sizeBytes: file.size, updatedAt: new Date() })
			.where(eq(resume.id, row.id));
		return { success: `${row.fileName} replaced with ${fileName}.` };
	},

	delete: async ({ request, locals }) => {
		const row = await ownResume(await request.formData(), locals.user!.id);
		if (!row) return fail(404, { error: 'That resume no longer exists.' });

		await db.delete(resume).where(eq(resume.id, row.id));
		await deleteResume(row.storagePath).catch(console.error);
		return { success: `${row.fileName} deleted.` };
	}
};
