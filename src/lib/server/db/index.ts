import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';
import { building } from '$app/environment';

// `vite build` loads this module to analyse routes, where no .env exists (e.g. in CI); the client
// only connects on the first query, so the check is only needed when the app actually runs
if (!building && !env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

// prepare: false keeps it working if you switch to the transaction pooler (port 6543)
const client = postgres(env.DATABASE_URL ?? '', { prepare: false });

export const db = drizzle(client, { schema });
