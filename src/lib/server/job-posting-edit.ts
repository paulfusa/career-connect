import { parseJobPosting, type JobPostingErrors, type JobPostingInput } from './job-posting.ts';

type UpdatedJobPosting = JobPostingInput & { updatedAt: Date };

type EditJobPostingResult =
	| { status: 'forbidden' }
	| { status: 'not-found' }
	| { status: 'invalid'; errors: JobPostingErrors; values: JobPostingInput }
	| { status: 'updated'; id: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function editJobPosting(
	user: { id: string; role: string },
	postingId: string,
	formData: FormData,
	update: (
		postingId: string,
		ownerId: string,
		values: UpdatedJobPosting
	) => Promise<string | null>
): Promise<EditJobPostingResult> {
	if (user.role !== 'recruiter') return { status: 'forbidden' };
	if (!UUID.test(postingId)) return { status: 'not-found' };

	const parsed = parseJobPosting(formData);
	if (!parsed.ok) return { status: 'invalid', errors: parsed.errors, values: parsed.values };

	const id = await update(postingId, user.id, { ...parsed.values, updatedAt: new Date() });
	return id ? { status: 'updated', id } : { status: 'not-found' };
}
