import { error, fail } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { companyProfile, jobPosting } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';
import { validateCompanyProfile } from '$lib/server/company-profile-validation';
import { companySlug } from '$lib/company-reviews';
import { slugOf } from '$lib/server/company-reviews-db';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Load one of the recruiter's companies (US-09: ?id= edits that one, without it you add a new one)
export const load: PageServerLoad = async ({ locals, url }) => {
    if (!locals.user || locals.user.role !== 'recruiter') {
        error(403, 'Only recruiters can manage company profiles.');
    }

    const id = url.searchParams.get('id');
    if (!id) return { company: null };

    const [company] = UUID.test(id)
        ? await db
            .select()
            .from(companyProfile)
            .where(and(eq(companyProfile.id, id), eq(companyProfile.recruiterId, locals.user.id)))
        : [];
    if (!company) error(404, 'Company not found.');

    return { company };
};

// Save a new company or update one of yours
export const actions = {
    save: async ({ request, locals }) => {

        // Only recruiters can save company information
        if (!locals.user || locals.user.role !== 'recruiter') {
            return fail(403, {
                message: 'Only recruiters can manage company profiles.'
            });
        }

        const formData = await request.formData();

        const id = String(formData.get('id') ?? '');
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

        // US-09: your companies, to find the one you're editing and to stop two with the same name
        const yours = await db
            .select({ id: companyProfile.id, name: companyProfile.name })
            .from(companyProfile)
            .where(eq(companyProfile.recruiterId, locals.user.id));
        const current = id ? yours.find((company) => company.id === id) : undefined;
        const slug = companySlug(name);

        if (id && !current) return fail(404, { ...values, message: 'Company not found.' });
        if (!slug) return fail(400, { ...values, message: 'The company name needs a letter or a number.' });
        if (yours.some((company) => company.id !== id && companySlug(company.name) === slug)) {
            return fail(400, { ...values, message: `You already have a company called ${name}.` });
        }

        let savedId = current?.id;
        if (current) {
            await db
                .update(companyProfile)
                .set({ name, description, location, website: website || null, updatedAt: new Date() })
                .where(and(eq(companyProfile.id, current.id), eq(companyProfile.recruiterId, locals.user.id)));

            // US-09: a new name goes on your jobs at this company too, so they still belong to it
            if (current.name !== name) {
                await db
                    .update(jobPosting)
                    .set({ company: name })
                    .where(and(eq(jobPosting.createdBy, locals.user.id), eq(slugOf(jobPosting.company), companySlug(current.name))));
            }
        } else {
            const [created] = await db
                .insert(companyProfile)
                .values({
                    recruiterId: locals.user.id,
                    name,
                    description,
                    location,
                    website: website || null
                })
                .returning({ id: companyProfile.id });
            savedId = created.id;
        }

        return {
            success: true,
            message: 'Company profile saved successfully.',
            id: savedId,
            name,
            description,
            location,
            website
        };
    }
} satisfies Actions;
