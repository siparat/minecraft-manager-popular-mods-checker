import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from '../config/index.js';
import * as schema from './schema.js';

export const queryClient = postgres(config.databaseUrl, { max: 10 });

export const db = drizzle(queryClient, { schema });

export type Database = typeof db;

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type Executor = Database | Transaction;

export async function closeDb(): Promise<void> {
	await queryClient.end({ timeout: 5 });
}
