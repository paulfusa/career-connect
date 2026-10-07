// Minimal client for any OpenAI-compatible chat API (Ollama locally, Gemini or Groq hosted).
// Config is passed in, and there are no $lib/$env imports, so it runs under plain `node --test`.

export type LlmConfig = { baseUrl: string; model: string; apiKey?: string };

export class LlmError extends Error {
	// unreachable: no server / timeout. rejected: the provider refused (bad key, unknown model, quota).
	// bad_output: it answered, but not with usable JSON.
	kind: 'unreachable' | 'rejected' | 'bad_output';

	constructor(kind: LlmError['kind'], message: string) {
		super(message);
		this.kind = kind;
	}
}

// Models wrap JSON in reasoning tags, code fences or chatter; take the outermost {...}.
export function extractJson(text: string): unknown {
	const cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
	const start = cleaned.indexOf('{');
	const end = cleaned.lastIndexOf('}');
	if (start === -1 || end <= start) throw new LlmError('bad_output', 'The model did not return JSON.');
	try {
		return JSON.parse(cleaned.slice(start, end + 1));
	} catch {
		throw new LlmError('bad_output', 'The model returned malformed JSON.');
	}
}

export async function completeJson(
	config: LlmConfig,
	request: { system: string; user: string; schemaName: string; schema: object; timeoutMs?: number },
	fetchFn: typeof fetch = fetch
): Promise<unknown> {
	const url = `${config.baseUrl.replace(/\/+$/, '')}/chat/completions`;
	const messages = [
		// the schema is also spelled out in the prompt, for providers that only do plain JSON mode
		{ role: 'system', content: `${request.system}\n\nReply with one JSON object matching this JSON Schema:\n${JSON.stringify(request.schema)}` },
		{ role: 'user', content: request.user }
	];
	const strict = { type: 'json_schema', json_schema: { name: request.schemaName, schema: request.schema, strict: true } };

	const send = (response_format: object, extra: object = {}) =>
		fetchFn(url, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				...(config.apiKey ? { authorization: `Bearer ${config.apiKey}` } : {})
			},
			body: JSON.stringify({ model: config.model, messages, temperature: 0.2, response_format, ...extra }),
			// generous: a laptop-sized local model needs 1-2 minutes for a full answer
			signal: AbortSignal.timeout(request.timeoutMs ?? 240_000)
		});

	let res: Response;
	try {
		// reasoning off: these are extraction/feedback tasks, and local "thinking" models are several times slower with it on
		res = await send(strict, { reasoning_effort: 'none' });
		// not every provider/model accepts schema-enforced output or the reasoning switch: retry with plain JSON mode
		if (res.status === 400 || res.status === 422) res = await send({ type: 'json_object' });
	} catch (e) {
		const timedOut = e instanceof Error && e.name === 'TimeoutError';
		throw new LlmError('unreachable', timedOut ? 'The AI model took too long to answer.' : `Could not reach the AI model at ${url}.`);
	}

	if (!res.ok) {
		const detail = (await res.text()).slice(0, 300);
		throw new LlmError('rejected', `The AI provider answered ${res.status}: ${detail}`);
	}

	const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
	const content = body.choices?.[0]?.message?.content;
	if (!content) throw new LlmError('bad_output', 'The model returned an empty answer.');
	return extractJson(content);
}
