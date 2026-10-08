import { env } from '$env/dynamic/private';

// Supabase Storage over its REST API. Server-side only: the secret key never reaches the browser.

const AVATARS = 'avatars'; // public bucket
const RESUMES = 'resumes'; // private bucket: files are only served through /resumes/[id] after an ownership check

export const AVATAR_TYPES = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' } as const;
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

const headers = () => {
	if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
		throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY must be set to store files');
	}
	return { apikey: env.SUPABASE_SECRET_KEY, Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}` };
};

const objectUrl = (bucket: string, path: string) => `${env.SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;

// creates the file, or overwrites it if the path already exists
async function put(bucket: string, path: string, file: File, contentType = file.type) {
	const res = await fetch(objectUrl(bucket, path), {
		method: 'POST',
		headers: { ...headers(), 'Content-Type': contentType, 'x-upsert': 'true' },
		body: file
	});
	if (!res.ok) throw new Error(`Upload to ${bucket} failed (${res.status}): ${await res.text()}`);
}

// a missing file is fine
async function remove(bucket: string, path: string) {
	const res = await fetch(objectUrl(bucket, path), { method: 'DELETE', headers: headers() });
	if (!res.ok && res.status !== 404 && res.status !== 400) {
		throw new Error(`Delete from ${bucket} failed (${res.status}): ${await res.text()}`);
	}
}

// One avatar per user, overwritten on each upload; ?v= busts browser caches of the old picture.
export async function uploadAvatar(userId: string, file: File): Promise<string> {
	const path = `${userId}/avatar`;
	await put(AVATARS, path, file);
	return `${env.SUPABASE_URL}/storage/v1/object/public/${AVATARS}/${path}?v=${Date.now()}`;
}

export const deleteAvatar = (userId: string) => remove(AVATARS, `${userId}/avatar`);

export const uploadResume = (path: string, file: File) => put(RESUMES, path, file, 'application/pdf');
export const deleteResume = (path: string) => remove(RESUMES, path);

// the stored PDF as a fetch Response, or null if the file is gone
export async function downloadResume(path: string): Promise<Response | null> {
	const res = await fetch(objectUrl(RESUMES, path), { headers: headers() });
	if (res.status === 404 || res.status === 400) return null;
	if (!res.ok) throw new Error(`Download from ${RESUMES} failed (${res.status}): ${await res.text()}`);
	return res;
}
