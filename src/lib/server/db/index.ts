import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

// prepare: false keeps it working if you switch to the transaction pooler (port 6543)
const client = postgres(env.DATABASE_URL, { prepare: false });

export const db = drizzle(client, { schema });
