import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { and, eq } from 'drizzle-orm';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { education, experience, profile, user } from '$lib/server/db/schema';
import { loadEntries } from '$lib/server/profile-data';
import {
	parseAbout,
	parseEducation,
	parseExperience,
	parseIntro,
	parsePreferences,
	parseSkills,
	type Errors,
	type Parsed
} from '$lib/server/profile';
import { AVATAR_MAX_BYTES, AVATAR_TYPES, deleteAvatar, uploadAvatar } from '$lib/server/storage';
import type { Actions, PageServerLoad } from './$types';

// Access control: every query and action is scoped to locals.user.id (never an id from the form alone),
// so a user can only read and change their own profile and entries.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DONE = '/profile?saved';

export const load: PageServerLoad = ({ locals }) => loadEntries(locals.user!.id);

type ProfileFields = Partial<Omit<typeof profile.$inferInsert, 'userId' | 'updatedAt'>>;

// saves one profile section: validate, write, then back to the profile
async function section(name: string, userId: string, parsed: Parsed<ProfileFields>) {
	if (!parsed.ok) return fail(400, { section: name, errors: parsed.errors });
	await db
		.insert(profile)
		.values({ userId, ...parsed.values })
		.onConflictDoUpdate({ target: profile.userId, set: { ...parsed.values, updatedAt: new Date() } });
	redirect(303, DONE);
}

const entryId = (data: FormData) => {
	const id = data.get('id')?.toString() ?? '';
	return UUID.test(id) ? id : null;
};

export const actions: Actions = {
	intro: async ({ request, locals }) => {
		const me = locals.user!;
		const data = await request.formData();
		const parsed = parseIntro(data, me.role);
		const errors: Errors = parsed.ok ? {} : { ...parsed.errors };

		const avatar = data.get('avatar');
		const hasAvatar = avatar instanceof File && avatar.size > 0;
		if (hasAvatar) {
			if (!(avatar.type in AVATAR_TYPES)) errors.avatar = 'Upload a PNG, JPG or WebP image.';
			else if (avatar.size > AVATAR_MAX_BYTES) errors.avatar = 'Use an image under 2 MB.';
		}
		if (!parsed.ok || Object.keys(errors).length) return fail(400, { section: 'intro', errors });

		let image: string | undefined;
		if (hasAvatar) {
			try {
				image = await uploadAvatar(me.id, avatar);
			} catch (error) {
				console.error(error);
				const errors: Errors = { avatar: 'Your picture could not be uploaded. Try again in a moment.' };
				return fail(500, { section: 'intro', errors });
			}
		}

		const { name, ...fields } = parsed.values;
		await db.transaction(async (tx) => {
			await tx.update(user).set(image ? { name, image } : { name }).where(eq(user.id, me.id));
			await tx
				.insert(profile)
				.values({ userId: me.id, ...fields })
				.onConflictDoUpdate({ target: profile.userId, set: { ...fields, updatedAt: new Date() } });
		});
		redirect(303, DONE);
	},

	about: async ({ request, locals }) => section('about', locals.user!.id, parseAbout(await request.formData())),
	skills: async ({ request, locals }) => section('skills', locals.user!.id, parseSkills(await request.formData())),
	preferences: async ({ request, locals }) =>
		section('preferences', locals.user!.id, parsePreferences(await request.formData())),

	saveExperience: async ({ request, locals }) => {
		const userId = locals.user!.id;
		const data = await request.formData();
		const parsed = parseExperience(data);
		if (!parsed.ok) return fail(400, { section: 'experience', errors: parsed.errors });

		const id = entryId(data);
		if (id) {
			await db.update(experience).set(parsed.values).where(and(eq(experience.id, id), eq(experience.userId, userId)));
		} else {
			await db.insert(experience).values({ userId, ...parsed.values });
		}
		redirect(303, DONE);
	},

	deleteExperience: async ({ request, locals }) => {
		const id = entryId(await request.formData());
		if (id) await db.delete(experience).where(and(eq(experience.id, id), eq(experience.userId, locals.user!.id)));
		redirect(303, DONE);
	},

	saveEducation: async ({ request, locals }) => {
		const userId = locals.user!.id;
		const data = await request.formData();
		const parsed = parseEducation(data);
		if (!parsed.ok) return fail(400, { section: 'education', errors: parsed.errors });

		const id = entryId(data);
		if (id) {
			await db.update(education).set(parsed.values).where(and(eq(education.id, id), eq(education.userId, userId)));
		} else {
			await db.insert(education).values({ userId, ...parsed.values });
		}
		redirect(303, DONE);
	},

	deleteEducation: async ({ request, locals }) => {
		const id = entryId(await request.formData());
		if (id) await db.delete(education).where(and(eq(education.id, id), eq(education.userId, locals.user!.id)));
		redirect(303, DONE);
	},

	email: async ({ request, locals }) => {
		const newEmail = (await request.formData()).get('email')?.toString().trim().toLowerCase() ?? '';
		const failWith = (message: string) => fail(400, { section: 'email', message, email: newEmail });

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return failWith('Enter a valid email address.');
		if (newEmail === locals.user!.email) return failWith('That is already your email.');

		try {
			await auth.api.changeEmail({ body: { newEmail }, headers: request.headers });
		} catch (error) {
			return failWith(
				error instanceof APIError ? error.message || 'Could not change your email.' : 'Something went wrong. Try again.'
			);
		}
		return { section: 'email', saved: true };
	},

	password: async ({ request }) => {
		const data = await request.formData();
		const currentPassword = data.get('currentPassword')?.toString() ?? '';
		const newPassword = data.get('newPassword')?.toString() ?? '';
		const confirmPassword = data.get('confirmPassword')?.toString() ?? '';
		const failWith = (message: string) => fail(400, { section: 'password', message });

		if (!currentPassword || !newPassword) return failWith('Fill in your current and new password.');
		if (newPassword.length < 8) return failWith('Use a new password with at least 8 characters.');
		if (newPassword !== confirmPassword) return failWith('The new passwords do not match.');

		try {
			// signs out every other device; this one gets a fresh session cookie
			await auth.api.changePassword({
				body: { currentPassword, newPassword, revokeOtherSessions: true },
				headers: request.headers
			});
		} catch (error) {
			if (error instanceof APIError && error.body?.code === 'INVALID_PASSWORD') {
				return failWith('Your current password is incorrect.');
			}
			return failWith(error instanceof APIError ? error.message : 'Something went wrong. Try again.');
		}
		return { section: 'password', saved: true };
	},

	deleteAccount: async ({ request, locals }) => {
		const data = await request.formData();
		const password = data.get('password')?.toString() ?? '';
		const failWith = (message: string) => fail(400, { section: 'delete', message });

		if (data.get('confirm')?.toString().trim() !== 'DELETE') return failWith('Type DELETE to confirm.');
		if (!password) return failWith('Enter your password to confirm.');

		try {
			// removes the user; profile, experience, education and sessions cascade in the DB
			await auth.api.deleteUser({ body: { password }, headers: request.headers });
		} catch (error) {
			if (error instanceof APIError && error.body?.code === 'INVALID_PASSWORD') {
				return failWith('Your password is incorrect.');
			}
			return failWith(error instanceof APIError ? error.message : 'Something went wrong. Try again.');
		}

		if (locals.user!.image) await deleteAvatar(locals.user!.id).catch((e) => console.error(e));
		redirect(303, '/login');
	}
};
