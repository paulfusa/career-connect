import { error } from '@sveltejs/kit';
import { ratingsFor, yourCompanies } from '$lib/server/company-reviews-db';
import type { PageServerLoad } from './$types';

// US-09: Company reviews in the recruiter sidebar. Lists the companies you're part of (your company profile
// and the companies on jobs you posted) with their stars, and each one opens its reviews
export const load: PageServerLoad = async ({ locals }) => {
	const me = locals.user;
	if (!me || me.role !== 'recruiter') error(403, 'Only recruiters have company reviews.');

	const companies = await yourCompanies(me.id);
	const ratings = await ratingsFor(companies.map((company) => company.slug));

	return { companies: companies.map((company) => ({ ...company, rating: ratings.get(company.slug) ?? null })) };
};
