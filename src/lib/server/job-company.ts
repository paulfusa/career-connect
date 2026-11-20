import { companySlug } from '$lib/company-reviews';
import { yourCompanies } from '$lib/server/company-reviews-db';
import { parseJobPosting } from '$lib/server/job-posting';

// US-09: recruiters can only post jobs for their own companies

// https://www.intel.com/ -> intel.com, for the job's logo
export function domainOf(website: string | null): string | null {
	if (!website) return null;
	try {
		return new URL(website).hostname.replace(/^www\./, '');
	} catch {
		return null;
	}
}

// checks the company before a job is saved. If it's yours, the form gets its exact name and logo,
// otherwise you get back the errors for the form
export async function checkJobCompany(userId: string, form: FormData) {
	const chosen = companySlug(form.get('company')?.toString() ?? '');
	const company = chosen ? (await yourCompanies(userId)).find((yours) => yours.slug === chosen) : undefined;

	if (!company) {
		const parsed = parseJobPosting(form);
		const errors = parsed.ok ? {} : parsed.errors;
		return { errors: { ...errors, company: 'Pick one of your companies.' }, values: parsed.values };
	}

	form.set('company', company.name);
	form.set('companyDomain', domainOf(company.website) ?? '');
	return null;
}
