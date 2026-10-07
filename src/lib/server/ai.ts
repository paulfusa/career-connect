import { env } from '$env/dynamic/private';
import { completeJson, LlmError, type LlmConfig } from './llm';
import { downloadResume } from './storage';

// Which AI model to use is purely configuration (see docs/ai-setup.md):
// Ollama on your own machine, or a hosted OpenAI-compatible API such as Gemini or Groq.
const config = (): LlmConfig | null =>
	env.AI_BASE_URL && env.AI_MODEL
		? { baseUrl: env.AI_BASE_URL, model: env.AI_MODEL, apiKey: env.AI_API_KEY || undefined }
		: null;

export const aiConfigured = () => config() !== null;
export const aiIsLocal = () => /localhost|127\.0\.0\.1|\[::1\]/.test(env.AI_BASE_URL ?? '');
export const aiModel = () => env.AI_MODEL ?? '';

export function askJson(request: { system: string; user: string; schemaName: string; schema: object }) {
	const c = config();
	if (!c) throw new LlmError('unreachable', 'AI is not configured (AI_BASE_URL and AI_MODEL).');
	return completeJson(c, request);
}

// what to tell the user when an AI call fails; the technical detail goes to the server log
export function aiErrorMessage(error: unknown): string {
	console.error(error);
	if (error instanceof LlmError) {
		if (error.kind === 'unreachable') {
			return aiIsLocal()
				? 'The AI model isn’t responding. Check that Ollama is running, then try again.'
				: 'The AI service isn’t responding. Try again in a moment.';
		}
		if (error.kind === 'rejected') return 'The AI service refused the request (check the model name, API key or quota).';
		return 'The AI couldn’t produce a usable answer this time. Try again.';
	}
	return 'Something went wrong. Try again in a moment.';
}

// The text of a stored resume PDF, or a message explaining why it can't be read.
export async function resumeText(storagePath: string): Promise<{ text: string } | { error: string }> {
	const file = await downloadResume(storagePath);
	if (!file) return { error: 'The resume file is missing. Upload it again.' };
	try {
		// imported lazily: the PDF engine is large and only these two features need it
		const { extractText, getDocumentProxy } = await import('unpdf');
		const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
		const { text } = await extractText(pdf, { mergePages: true });
		if (text.trim().length < 100) {
			return { error: 'This PDF has no readable text. It may be a scan or an image; export it from your editor as a text PDF.' };
		}
		return { text };
	} catch (e) {
		console.error(e);
		return { error: 'This PDF couldn’t be read. Try exporting it again.' };
	}
}
