
import { error } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { companyProfile } from '$lib/server/db/schema';
import { companySlug } from '$lib/company-reviews';
import { ratingsFor } from '$lib/server/company-reviews-db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user || locals.user.role !== 'recruiter') {
        error(403, 'Only recruiters can manage company profiles.');
    }

    // US-34: a recruiter can have several companies
    const companies = await db
        .select()
        .from(companyProfile)
        .where(eq(companyProfile.recruiterId, locals.user.id))
        .orderBy(asc(companyProfile.name));

    // US-09: each company's stars, shown under its name
    const slugs = companies.map((company) => companySlug(company.name));
    const ratings = await ratingsFor(slugs.filter(Boolean));

    return {
        companies: companies.map((company, i) => ({ ...company, slug: slugs[i], rating: ratings.get(slugs[i]) ?? null }))
    };
};
