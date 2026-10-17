
import { error, fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { companyProfile } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';
import { validateCompanyProfile } from '$lib/server/company-profile-validation';

// Load the recruiter's existing company profile
export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user || locals.user.role !== 'recruiter') {
        error(403, 'Only recruiters can manage company profiles.');
    }
  
    const company = await db
        .select()
        .from(companyProfile)
        .where(eq(companyProfile.recruiterId, locals.user.id))
        .limit(1);

    return {
        company: company[0] ?? null
    };

};

// Save or update the company profile
export const actions = {
    save: async ({ request, locals }) => {

        // Only recruiters can save company information
        if (!locals.user || locals.user.role !== 'recruiter') {
            return fail(403, {
                message: 'Only recruiters can manage company profiles.'
            });
        }

        const formData = await request.formData();

        const name = String(formData.get('name') ?? '').trim();
        const description = String(formData.get('description') ?? '').trim();
        const location = String(formData.get('location') ?? '').trim();
        const website = String(formData.get('website') ?? '').trim();
        const values = { name, description, location, website };

        // Validate the required fields
        const validationError = validateCompanyProfile(
            name,
            description,
            location,
            website
        );

        if (validationError) {
            return fail(400, {
                ...values,
                message: validationError
            });
        }


        // Create a company or update the existing company
        await db.insert(companyProfile)
            .values({
                recruiterId: locals.user.id,
                name,
                description,
                location,
                website: website || null
            })
            .onConflictDoUpdate({
                target: companyProfile.recruiterId,
                set: {
                    name,
                    description,
                    location,
                    website: website || null,
                    updatedAt: new Date()
                }
            });

        return {
            success: true,
            message: 'Company profile saved successfully.',
            name,
            description,
            location,
            website
        };
    }
} satisfies Actions;
