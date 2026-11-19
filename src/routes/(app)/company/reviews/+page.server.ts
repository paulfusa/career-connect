import { error } from '@sveltejs/kit';
import { ratingsFor, yourCompanies } from '$lib/server/company-reviews-db';
import type { PageServerLoad } from './$types';

// US-09: Company reviews for recruiters, your companies with their stars
export const load: PageServerLoad = async ({ locals }) => {
	const me = locals.user;
	if (!me || me.role !== 'recruiter') error(403, 'Only recruiters have company reviews.');

	const companies = await yourCompanies(me.id);
	const ratings = await ratingsFor(companies.map((company) => company.slug));

	return { companies: companies.map((company) => ({ ...company, rating: ratings.get(company.slug) ?? null })) };
};
