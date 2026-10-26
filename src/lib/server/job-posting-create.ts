import { parseJobPosting, type JobPostingErrors, type JobPostingInput } from './job-posting.ts';

type CreatedJobPosting = JobPostingInput & { createdBy: string };

type CreateJobPostingResult =
	| { status: 'forbidden' }
	| { status: 'invalid'; errors: JobPostingErrors; values: JobPostingInput }
	| { status: 'created'; id: string };

export async function createJobPosting(
	user: { id: string; role: string },
	formData: FormData,
	insert: (values: CreatedJobPosting) => Promise<string>
): Promise<CreateJobPostingResult> {
	if (user.role !== 'recruiter') return { status: 'forbidden' };

	const parsed = parseJobPosting(formData);
	if (!parsed.ok) return { status: 'invalid', errors: parsed.errors, values: parsed.values };

	const id = await insert({ ...parsed.values, createdBy: user.id });
	return { status: 'created', id };
}
