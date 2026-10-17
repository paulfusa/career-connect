
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { companyProfile } from '$lib/server/db/schema';
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

    return {
        company: company ?? null
    };
};
