import { companySlug } from '$lib/company-reviews';
import { yourCompanies } from '$lib/server/company-reviews-db';
import { parseJobPosting, type JobPostingErrors, type JobPostingInput } from '$lib/server/job-posting';

// US-09: recruiters can only post jobs for their own companies (their company profiles)

// https://www.intel.com/ -> intel.com, for the logo on the job
export function domainOf(website: string | null): string | null {
	if (!website) return null;
	try {
		return new URL(website).hostname.replace(/^www\./, '');
	} catch {
		return null;
	}
}

// used before a job is created or saved. If the company is one of yours, the form gets its exact
// name and website, otherwise you get the errors to show on the form
export async function checkJobCompany(userId: string, form: FormData): Promise<{ errors: JobPostingErrors; values: JobPostingInput } | null> {
	const chosen = companySlug(form.get('company')?.toString() ?? '');
	const company = chosen ? (await yourCompanies(userId)).find((yours) => yours.slug === chosen) : undefined;

	if (!company) {
		const parsed = parseJobPosting(form);
		return { errors: { ...(parsed.ok ? {} : parsed.errors), company: 'Pick one of your companies.' }, values: parsed.values };
	}

	form.set('company', company.name);
	form.set('companyDomain', domainOf(company.website) ?? '');
	return null;
}
