import { EMPLOYMENT_TYPES, LIMITS, WORK_MODES } from '../profile-options.ts';

export type JobPostingInput = {
	title: string;
	company: string;
	companyDomain: string | null;
	location: string;
	employmentType: string;
	workMode: string;
	description: string;
	status: string;
	published: boolean;
	requirements: string;
	applicationDeadline: string;
	salaryMin: number | null;
	salaryMax: number | null;
};

export type JobPostingErrors = Partial<Record<keyof JobPostingInput, string>>;
export type JobPostingParse =
	| { ok: true; values: JobPostingInput }
	| { ok: false; errors: JobPostingErrors; values: JobPostingInput };

const DESCRIPTION_LIMIT = 5000;
const REQUIREMENTS_LIMIT = 5000;
const DOMAIN = /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/;
const toSalary = (value: FormDataEntryValue | null): number | null => {
	const text = value?.toString().trim() ?? '';
	return text === '' ? null : Number(text);
};

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
		description: data.get('description')?.toString().trim() ?? '',
		status: data.get('status')?.toString() ?? 'open',
		published: data.get('published') === 'on',
		requirements: data.get('requirements')?.toString().trim() ?? '',
		applicationDeadline: data.get('applicationDeadline')?.toString() ?? '',
		salaryMin: toSalary(data.get('salaryMin')),
		salaryMax: toSalary(data.get('salaryMax'))
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
	if (!values.requirements) errors.requirements = 'Requirements need to be listed.';
	else if (values.requirements.length > REQUIREMENTS_LIMIT) {
		errors.requirements = `Requirements must be ${REQUIREMENTS_LIMIT} characters or fewer.`;
	}
	if (!values.applicationDeadline) errors.applicationDeadline = 'The deadline for job offers must be set.';
	if (values.status !== 'open' && values.status !== 'closed') errors.status = 'Choose Open or Closed.';
	const salary = (key: 'salaryMin' | 'salaryMax', label: string) => {
		const amount = values[key];
		if (amount !== null && (!Number.isInteger(amount) || amount < 0)) {
			errors[key] = `${label} must be a whole number of 0 or more.`;
		}
	};

	salary('salaryMin', 'Minimum Salary');
	salary('salaryMax', 'Maximum Salary');

	if (values.salaryMin !== null && values.salaryMax !== null && values.salaryMin > values.salaryMax) {
		errors.salaryMax = 'The maximum salary cannot be less than the minimum.';
	}
	return Object.keys(errors).length ? { ok: false, errors, values } : { ok: true, values };
}
