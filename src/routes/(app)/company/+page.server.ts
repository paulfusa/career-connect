
import { error } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { companyProfile, companyReview } from '$lib/server/db/schema';
import { toRating } from '$lib/server/company-reviews';
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
    const [stars] = company
        ? await db
            .select({ average: sql<string | null>`avg(${companyReview.rating})`, reviews: sql<number>`count(*)::int` })
            .from(companyReview)
            .where(eq(companyReview.companyId, company.id))
        : [];

    return {
        company: company ?? null,
        rating: stars ? toRating(stars.average, stars.reviews) : null
    };
};
