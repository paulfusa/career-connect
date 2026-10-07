// US-10/US-11: resume file validation. No $lib/$env imports so it runs under plain `node --test`.

// 4 MB: under the ~4.5 MB request body cap of serverless hosts like Vercel
export const RESUME_MAX_MB = 4;
export const RESUME_MAX_BYTES = RESUME_MAX_MB * 1024 * 1024;
export const RESUME_MAX_COUNT = 5;

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"

// Returns an error message, or null when the file is an acceptable PDF.
// `head` is the first bytes of the file: the browser-reported type and the extension can both be
// faked, so the content itself has to start like a PDF too.
export function validateResume(file: { name: string; type: string; size: number }, head: Uint8Array): string | null {
	if (!file.size) return 'Choose a PDF to upload.';
	const looksLikePdf =
		file.type === 'application/pdf' &&
		file.name.toLowerCase().endsWith('.pdf') &&
		PDF_MAGIC.every((byte, i) => head[i] === byte);
	if (!looksLikePdf) return 'Only PDF files are accepted.';
	if (file.size > RESUME_MAX_BYTES) return `Use a PDF under ${RESUME_MAX_MB} MB.`;
	return null;
}

// The name shown in the list. Never used as a storage path (that's `${userId}/${id}.pdf`).
export function cleanFileName(name: string): string {
	const base = name.split(/[\\/]/).pop() ?? '';
	// eslint-disable-next-line no-control-regex
	const safe = base.replace(/[\u0000-\u001f\u007f]/g, '').trim();
	const stem = safe.replace(/\.pdf$/i, '').slice(0, 100).trim() || 'Resume';
	return `${stem}.pdf`;
}

export function formatBytes(bytes: number): string {
	return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
