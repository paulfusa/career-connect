import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { companyProfile } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

// US-09: Company reviews in the recruiter sidebar, sends them to their own company page
export const load: PageServerLoad = async ({ locals }) => {
	const me = locals.user;
	if (!me || me.role !== 'recruiter') error(403, 'Only recruiters have company reviews.');

	const [company] = await db.select({ id: companyProfile.id }).from(companyProfile).where(eq(companyProfile.recruiterId, me.id));
	if (company) redirect(303, `/companies/${company.id}`);

	// no company profile yet, the page says to make one
	return {};
};
