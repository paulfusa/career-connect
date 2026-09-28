import { env } from '$env/dynamic/private';

const BUCKET = 'avatars';
export const AVATAR_TYPES = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' } as const;
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

const headers = () => {
	if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
		throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY must be set to store profile pictures');
	}
	return { apikey: env.SUPABASE_SECRET_KEY, Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}` };
};

// Uploads to Supabase Storage over its REST API (server-side only, secret key never reaches the browser).
// One file per user, overwritten on each upload; ?v= busts browser caches of the old picture.
export async function uploadAvatar(userId: string, file: File): Promise<string> {
	const path = `${userId}/avatar`;
	const res = await fetch(`${env.SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
		method: 'POST',
		headers: {
			...headers(),
			'Content-Type': file.type,
			'x-upsert': 'true'
		},
		body: file
	});
	if (!res.ok) throw new Error(`Avatar upload failed (${res.status}): ${await res.text()}`);
	return `${env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}?v=${Date.now()}`;
}

// used when an account is deleted; a missing file is fine
export async function deleteAvatar(userId: string) {
	const res = await fetch(`${env.SUPABASE_URL}/storage/v1/object/${BUCKET}/${userId}/avatar`, {
		method: 'DELETE',
		headers: headers()
	});
	if (!res.ok && res.status !== 404 && res.status !== 400) {
		throw new Error(`Avatar delete failed (${res.status}): ${await res.text()}`);
	}
}
