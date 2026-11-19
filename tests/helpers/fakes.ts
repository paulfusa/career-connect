// Shared fakes for testing route handlers and server modules without Supabase, emails or an AI model.
// Call useFakes() before importing the code under test; every $lib import then loads the real file
// from src/lib, except the modules listed in `fakeModules`, which are swapped for the objects below.
import { registerHooks } from 'node:module';
import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { getTableName, isTable } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { isActionFailure, isHttpError, isRedirect } from '@sveltejs/kit';

const SRC_LIB = new URL('../../src/lib/', import.meta.url);

// --- fake database -----------------------------------------------------------------------------

export type Query = {
	op: 'select' | 'insert' | 'update' | 'delete' | 'execute';
	table?: string;
	fields?: string[];
	values?: unknown;
	set?: Record<string, unknown>;
	conflict?: unknown;
	sql?: string; // the WHERE clause, or the raw statement for execute()
	params?: unknown[];
};

const dialect = new PgDialect();
const toQuery = (condition: unknown) => dialect.sqlToQuery(condition as Parameters<PgDialect['sqlToQuery']>[0]);

// Every query is recorded in db.queries. Each awaited query gets the next rows from db.results
// (or [] when it's empty), so queue them in the order the code runs its queries.
function createDb() {
	const db = {
		queries: [] as Query[],
		results: [] as unknown[][],
		reset() {
			db.queries.length = 0;
			db.results.length = 0;
		}
	};
	const builder = (query: Query) => {
		db.queries.push(query);
		const chain: Record<string, unknown> = new Proxy(
			{},
			{
				get(_, prop) {
					if (prop === 'then') {
						return (resolve: (rows: unknown) => unknown, reject: (e: unknown) => unknown) =>
							Promise.resolve(db.results.shift() ?? []).then(resolve, reject);
					}
					return (arg: unknown) => {
						if (prop === 'from' && isTable(arg)) query.table = getTableName(arg);
						if (prop === 'where' && arg) Object.assign(query, toQuery(arg));
						if (prop === 'values') query.values = arg;
						if (prop === 'set') query.set = arg as Record<string, unknown>;
						if (prop === 'onConflictDoUpdate' || prop === 'onConflictDoNothing') query.conflict = arg ?? true;
						return chain;
					};
				}
			}
		);
		return chain;
	};
	const api = {
		select: (fields?: object) => builder({ op: 'select', fields: fields && Object.keys(fields) }),
		insert: (table: Parameters<typeof getTableName>[0]) => builder({ op: 'insert', table: getTableName(table) }),
		update: (table: Parameters<typeof getTableName>[0]) => builder({ op: 'update', table: getTableName(table) }),
		delete: (table: Parameters<typeof getTableName>[0]) => builder({ op: 'delete', table: getTableName(table) }),
		execute: (statement: unknown) => builder({ op: 'execute', ...toQuery(statement) })
	};
	// a transaction runs its callback on the same fake, so its queries are recorded in order
	const transaction = async <T>(callback: (tx: typeof api) => Promise<T>) => callback(api);
	return Object.assign(db, api, { transaction });
}

// --- the fakes ---------------------------------------------------------------------------------

// records each call's arguments in `calls`; `impl` decides what it returns (replace it per test)
export function spy<A extends unknown[], R>(impl: (...args: A) => R) {
	const fn = Object.assign(
		(...args: A): R => {
			fn.calls.push(args);
			return fn.impl(...args);
		},
		{ impl, calls: [] as A[] }
	);
	return fn;
}
type AnySpy = { (...args: never[]): unknown; impl: (...args: never[]) => unknown; calls: unknown[][] };

export const fake = {
	db: createDb(),
	env: {} as Record<string, string | undefined>,
	auth: { api: {} as Record<string, AnySpy>, options: {} },
	storage: {
		uploadAvatar: spy<[string, File], Promise<string>>(async (userId) => `https://storage.test/avatars/${userId}/avatar`),
		deleteAvatar: spy<[string], Promise<void>>(async () => undefined),
		uploadResume: spy<[string, File], Promise<void>>(async () => undefined),
		deleteResume: spy<[string], Promise<void>>(async () => undefined),
		downloadResume: spy<[string], Promise<Response | null>>(async () => new Response('%PDF-1.7 file')),
		AVATAR_TYPES: { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' },
		AVATAR_MAX_BYTES: 2 * 1024 * 1024
	},
	ai: {
		aiConfigured: spy<[], boolean>(() => true),
		aiIsLocal: spy<[], boolean>(() => true),
		aiModel: spy<[], string>(() => 'test-model'),
		askJson: spy<[{ system: string; user: string; schemaName: string; schema: object }], Promise<unknown>>(async () => ({})),
		aiErrorMessage: spy<[unknown], string>((e) => `AI failed: ${e instanceof Error ? e.message : e}`),
		resumeText: spy<[string], Promise<{ text: string } | { error: string }>>(async () => ({ text: 'Ana Tremblay, developer' }))
	},
	email: {
		sendVerificationEmail: spy<[{ to: string; verificationUrl: string }], Promise<void>>(async () => undefined),
		sendPasswordResetCode: spy<[string, string], Promise<void>>(async () => undefined),
		sendJobOfferEmail: spy<[string, string], Promise<void>>(async () => undefined)
	},
	environment: { building: false, browser: false, dev: true }
};

// SvelteKit's virtual modules, always faked
const virtualModules: Record<string, keyof typeof moduleObjects> = {
	'$env/dynamic/private': 'envModule',
	'$app/environment': 'environment',
	'$app/server': 'server'
};
// files in src/lib that talk to the outside world, faked however they're imported ($lib/… or ./…)
const fakeFiles: Record<string, keyof typeof moduleObjects> = {
	'server/db/index.ts': 'dbModule',
	'server/auth.ts': 'authModule',
	'server/storage.ts': 'storage',
	'server/ai.ts': 'ai',
	'server/email.ts': 'email'
};
const moduleObjects = {
	...fake,
	dbModule: { db: fake.db },
	envModule: { env: fake.env },
	authModule: { auth: fake.auth },
	server: { getRequestEvent: () => undefined }
};
(globalThis as typeof globalThis & { __fakeModules: unknown }).__fakeModules = moduleObjects;

// Functions are exported as wrappers, so a test can swap fake.storage.uploadResume.impl
// (or the whole function) after the module under test has imported it. Plain values such as
// fake.environment.building are live bindings: setting them updates every importer.
function moduleSource(name: keyof typeof moduleObjects) {
	const lines = [`const m = globalThis.__fakeModules[${JSON.stringify(name)}];`];
	for (const [key, value] of Object.entries(moduleObjects[name])) {
		if (typeof value === 'function') lines.push(`export const ${key} = (...a) => m.${key}(...a);`);
		else if (typeof value === 'object') lines.push(`export const ${key} = m.${key};`);
		else {
			lines.push(
				`export let ${key} = m.${key};`,
				`Object.defineProperty(m, ${JSON.stringify(key)}, { get: () => ${key}, set: (v) => { ${key} = v; } });`
			);
		}
	}
	return lines.join('\n');
}

const firstExisting = (base: URL, endings: string[]) =>
	endings.map((e) => new URL(base.href + e)).find((u) => statSync(fileURLToPath(u), { throwIfNoEntry: false })?.isFile());

// `keep` lists files in src/lib this test wants real instead of faked (e.g. 'server/storage.ts')
export function useFakes({ keep = [] as string[] } = {}) {
	const resolved = (url: URL | undefined) => {
		if (!url) return undefined;
		const libPath = url.href.startsWith(SRC_LIB.href) ? url.href.slice(SRC_LIB.href.length) : '';
		const fakeName = fakeFiles[libPath];
		return { url: fakeName && !keep.includes(libPath) ? `fake:${fakeName}` : url.href, shortCircuit: true };
	};
	registerHooks({
		resolve(specifier, context, next) {
			if (specifier in virtualModules) return { url: `fake:${virtualModules[specifier]}`, shortCircuit: true };
			if (specifier.startsWith('$lib/')) {
				const found = resolved(firstExisting(new URL(specifier.slice(5), SRC_LIB), ['.ts', '.svelte.ts', '/index.ts', '']));
				if (found) return found;
			}
			// TypeScript lets src/ import './db' or './auth.schema' without the extension; Node needs it
			if (specifier.startsWith('.') && context.parentURL?.includes('/src/')) {
				const found = resolved(firstExisting(new URL(specifier, context.parentURL), ['', '.ts', '/index.ts']));
				if (found) return found;
			}
			return next(specifier, context);
		},
		load(url, context, next) {
			if (url.startsWith('fake:')) {
				return { format: 'module', source: moduleSource(url.slice(5) as keyof typeof moduleObjects), shortCircuit: true };
			}
			return next(url, context);
		}
	});
}

// Puts every fake back to its default: empty database and env, default spy behaviour, no calls.
const defaults = new Map<AnySpy, AnySpy['impl']>();
for (const group of [fake.storage, fake.ai, fake.email]) {
	for (const value of Object.values(group)) if (typeof value === 'function') defaults.set(value as AnySpy, (value as AnySpy).impl);
}
export function resetFakes() {
	fake.db.reset();
	for (const key of Object.keys(fake.env)) delete fake.env[key];
	for (const key of Object.keys(fake.auth.api)) delete fake.auth.api[key];
	for (const [fn, impl] of defaults) {
		fn.impl = impl;
		fn.calls.length = 0;
	}
	fake.environment.building = false;
}

// --- request helpers ---------------------------------------------------------------------------

export const seeker = { id: 'seeker-1', role: 'job_seeker', email: 'ana@example.com', emailVerified: true, image: null as string | null };
export const recruiter = { id: 'recruiter-1', role: 'recruiter', email: 'ben@example.com', emailVerified: true, image: null as string | null };

// a SvelteKit request event; `form` becomes a multipart POST body (File values stay files)
export function event({
	user,
	form,
	params = {},
	url = 'http://localhost/'
}: { user?: object | null; form?: Record<string, string | string[] | File>; params?: Record<string, string>; url?: string } = {}) {
	let request = new Request(url);
	if (form) {
		const body = new FormData();
		for (const [key, value] of Object.entries(form)) {
			for (const v of Array.isArray(value) ? value : [value]) body.append(key, v);
		}
		request = new Request(url, { method: 'POST', body });
	}
	return { request, url: new URL(url), params, locals: { user: user ?? undefined }, fetch } as never;
}

export type Outcome =
	| { kind: 'redirect'; status: number; location: string }
	| { kind: 'error'; status: number; message: string }
	| { kind: 'fail'; status: number; data: Record<string, unknown> }
	| { kind: 'ok'; data: unknown };

// runs a load, action or endpoint and says how it ended
export async function run(handler: () => unknown): Promise<Outcome> {
	try {
		const data = await handler();
		if (isActionFailure(data)) return { kind: 'fail', status: data.status, data: (data.data ?? {}) as Record<string, unknown> };
		return { kind: 'ok', data };
	} catch (e) {
		if (isRedirect(e)) return { kind: 'redirect', status: e.status, location: e.location };
		if (isHttpError(e)) return { kind: 'error', status: e.status, message: e.body.message };
		throw e;
	}
}

// a small file with the given type and first bytes
export const file = (name: string, type: string, content: BlobPart = '%PDF-1.7 test') =>
	new File([content], name, { type });
