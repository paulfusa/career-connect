
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { companyProfile } from '$lib/server/db/schema';
import { companySlug } from '$lib/company-reviews';
import { ratingsFor } from '$lib/server/company-reviews-db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user || locals.user.role !== 'recruiter') {
        error(403, 'Only recruiters can manage company profiles.');
    }

    const [company] = await db
        .select()
        .from(companyProfile)
        .where(eq(companyProfile.recruiterId, locals.user.id))
        .limit(1);

    // US-09: the company's stars, shown under its name
    const slug = company ? companySlug(company.name) : '';
    const ratings = await ratingsFor(slug ? [slug] : []);

    return {
        company: company ?? null,
        companySlug: slug,
        rating: ratings.get(slug) ?? null
    };
};
