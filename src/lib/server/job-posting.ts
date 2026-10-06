import { EMPLOYMENT_TYPES, LIMITS, WORK_MODES } from '../profile-options.ts';

export type JobPostingInput = {
	title: string;
	company: string;
	companyDomain: string | null;
	location: string;
	employmentType: string;
	workMode: string;
	description: string;
};

export type JobPostingErrors = Partial<Record<keyof JobPostingInput, string>>;
export type JobPostingParse =
	| { ok: true; values: JobPostingInput }
	| { ok: false; errors: JobPostingErrors; values: JobPostingInput };

const DESCRIPTION_LIMIT = 5000;
const DOMAIN = /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/;

export function parseJobPosting(data: FormData): JobPostingParse {
	const errors: JobPostingErrors = {};
	// hidden field filled by the company autocomplete; silently dropped if malformed
	const domain = data.get('companyDomain')?.toString().trim().toLowerCase() ?? '';
	const values: JobPostingInput = {
		title: data.get('title')?.toString().trim() ?? '',
		company: data.get('company')?.toString().trim() ?? '',
		companyDomain: DOMAIN.test(domain) ? domain : null,
		location: data.get('location')?.toString().trim() ?? '',
		employmentType: data.get('employmentType')?.toString() ?? '',
		workMode: data.get('workMode')?.toString() ?? '',
		description: data.get('description')?.toString().trim() ?? ''
	};

	const text = (key: 'title' | 'company' | 'location', label: string) => {
		if (!values[key]) errors[key] = `${label} is required.`;
		else if (values[key].length > LIMITS.short) {
			errors[key] = `${label} must be ${LIMITS.short} characters or fewer.`;
		}
	};

	text('title', 'Job title');
	text('company', 'Company');
	text('location', 'Location');

	if (!Object.hasOwn(EMPLOYMENT_TYPES, values.employmentType)) {
		errors.employmentType = 'Choose a valid employment type.';
	}
	if (!Object.hasOwn(WORK_MODES, values.workMode)) errors.workMode = 'Choose a valid work mode.';
	if (!values.description) errors.description = 'Description is required.';
	else if (values.description.length > DESCRIPTION_LIMIT) {
		errors.description = `Description must be ${DESCRIPTION_LIMIT} characters or fewer.`;
	}

	return Object.keys(errors).length ? { ok: false, errors, values } : { ok: true, values };
}
