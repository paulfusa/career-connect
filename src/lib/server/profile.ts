// US-04: profile form validation, one parser per profile section.
// Relative imports only (no $lib/$env) so it runs under plain `node --test`.
import { EMPLOYMENT_TYPES, JOB_TYPES, LIMITS, WORK_MODES } from '../profile-options.ts';

type Role = 'job_seeker' | 'recruiter';
export type Errors = Record<string, string>;
export type Parsed<T> = { ok: true; values: T } | { ok: false; errors: Errors };

const PHONE = /^\+?[0-9 ().-]{7,20}$/;
const DOMAIN = /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i;
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

// small reader shared by every parser: collects errors instead of throwing
function reader(data: FormData) {
	const errors: Errors = {};

	const text = (key: string, label: string, max: number = LIMITS.short, required = false) => {
		const value = data.get(key)?.toString().trim() ?? '';
		if (!value) {
			if (required) errors[key] = `${label} is required.`;
			return null;
		}
		if (value.length > max) errors[key] = `${label} must be ${max} characters or fewer.`;
		return value;
	};

	// repeated inputs with the same name (chip pickers); trimmed, de-duplicated case-insensitively
	const list = (key: string, label: string, maxItems: number, maxLength: number = LIMITS.short) => {
		const seen = new Set<string>();
		const items = data
			.getAll(key)
			.map((v) => v.toString().trim())
			.filter((v) => v && !seen.has(v.toLowerCase()) && seen.add(v.toLowerCase()));
		if (items.length > maxItems) errors[key] = `Add ${maxItems} ${label} or fewer.`;
		else if (items.some((v) => v.length > maxLength)) {
			errors[key] = `Each of your ${label} must be ${maxLength} characters or fewer.`;
		}
		return items;
	};

	const choices = (key: string, allowed: Record<string, string>) =>
		[...new Set(data.getAll(key).map(String))].filter((v) => v in allowed);

	const url = (key: string, label: string) => {
		let value = text(key, label, LIMITS.url);
		if (!value) return null;
		if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
		try {
			const parsed = new URL(value);
			if (!parsed.hostname.includes('.')) throw new Error();
			return parsed.href;
		} catch {
			errors[key] = `Enter a valid link for ${label}.`;
			return null;
		}
	};

	// hidden field filled by the company/school autocomplete; silently dropped if malformed
	const domain = (key: string) => {
		const value = data.get(key)?.toString().trim().toLowerCase() ?? '';
		return DOMAIN.test(value) ? value : null;
	};

	const done = <T>(values: T): Parsed<T> =>
		Object.keys(errors).length ? { ok: false, errors } : { ok: true, values };

	return { errors, text, list, choices, url, domain, done };
}

export function parseIntro(data: FormData, role: Role) {
	const r = reader(data);
	const name = r.text('name', 'Name', LIMITS.short, true) ?? '';
	const phone = r.text('phone', 'Phone number');
	if (phone && !PHONE.test(phone)) r.errors.phone = 'Enter a valid phone number, e.g. +1 514 555 0123.';
	const isSeeker = role === 'job_seeker';

	return r.done({
		name,
		phone,
		location: r.text('location', 'Location'),
		headline: r.text('headline', 'Headline'),
		linkedinUrl: r.url('linkedinUrl', 'LinkedIn'),
		githubUrl: isSeeker ? r.url('githubUrl', 'GitHub') : null,
		websiteUrl: r.url('websiteUrl', 'Website'),
		// recruiter-only fields are ignored for job seekers
		company: isSeeker ? null : r.text('company', 'Company', LIMITS.short, true),
		companyDomain: isSeeker ? null : r.domain('companyDomain'),
		jobTitle: isSeeker ? null : r.text('jobTitle', 'Job title')
	});
}

export function parseAbout(data: FormData) {
	const r = reader(data);
	return r.done({ about: r.text('about', 'About', LIMITS.about) });
}

export function parseSkills(data: FormData) {
	const r = reader(data);
	const skills = r.list('skills', 'skills', LIMITS.skills, LIMITS.skill);
	const lower = new Set(skills.map((s) => s.toLowerCase()));
	const topSkills = r.list('topSkills', 'top skills', LIMITS.topSkills).filter((s) => lower.has(s.toLowerCase()));
	return r.done({ skills, topSkills });
}

export function parsePreferences(data: FormData) {
	const r = reader(data);
	return r.done({
		openToWork: data.get('openToWork') === 'on',
		desiredRoles: r.list('desiredRoles', 'roles', LIMITS.listItems),
		jobTypes: r.choices('jobTypes', JOB_TYPES),
		workModes: r.choices('workModes', WORK_MODES),
		preferredLocations: r.list('preferredLocations', 'locations', LIMITS.listItems)
	});
}

// <input type="month"> gives YYYY-MM; stored as the first day of that month
export function parseExperience(data: FormData, today = new Date()) {
	const r = reader(data);
	const title = r.text('title', 'Title', LIMITS.short, true) ?? '';
	const company = r.text('company', 'Company', LIMITS.short, true) ?? '';
	const type = data.get('employmentType')?.toString() ?? '';
	const current = data.get('current') === 'on';
	const thisMonth = today.toISOString().slice(0, 7);

	const month = (key: string, label: string) => {
		const value = data.get(key)?.toString() ?? '';
		if (!value) return null;
		if (!MONTH.test(value)) r.errors[key] = `Enter a valid ${label.toLowerCase()}.`;
		return value;
	};
	const start = month('startDate', 'Start date');
	const end = current ? null : month('endDate', 'End date');

	if (!start) r.errors.startDate = 'Start date is required.';
	else if (start > thisMonth) r.errors.startDate = 'Start date can’t be in the future.';
	if (!current && !end && !r.errors.endDate) r.errors.endDate = 'Add an end date, or tick “I currently work here”.';
	if (start && end && end < start) r.errors.endDate = 'End date must be after the start date.';

	return r.done({
		title,
		company,
		companyDomain: r.domain('companyDomain'),
		employmentType: type in EMPLOYMENT_TYPES ? type : null,
		location: r.text('location', 'Location'),
		startDate: start ? `${start}-01` : '',
		endDate: end ? `${end}-01` : null,
		description: r.text('description', 'Description', LIMITS.description)
	});
}

export function parseEducation(data: FormData, today = new Date()) {
	const r = reader(data);
	const maxYear = today.getFullYear() + 8;

	const year = (key: string, label: string) => {
		const value = data.get(key)?.toString().trim() ?? '';
		if (!value) return null;
		const n = Number(value);
		if (!Number.isInteger(n) || n < 1950 || n > maxYear) {
			r.errors[key] = `${label} must be between 1950 and ${maxYear}.`;
			return null;
		}
		return n;
	};
	const startYear = year('startYear', 'Start year');
	const endYear = year('endYear', 'End year (or expected)');
	if (startYear && endYear && endYear < startYear) r.errors.endYear = 'End year must be after the start year.';

	return r.done({
		school: r.text('school', 'School', LIMITS.short, true) ?? '',
		schoolDomain: r.domain('schoolDomain'),
		degree: r.text('degree', 'Degree'),
		fieldOfStudy: r.text('fieldOfStudy', 'Field of study'),
		startYear,
		endYear,
		description: r.text('description', 'Description', LIMITS.description)
	});
}
