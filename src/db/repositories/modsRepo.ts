import { eq, sql } from 'drizzle-orm';
import { db, type Executor } from '../client.js';
import { mods, type ModRow, type NewModRow } from '../schema.js';

export type UpsertModInput = Pick<NewModRow, 'id' | 'name' | 'url' | 'author' | 'categories'>;

export async function upsertMod(input: UpsertModInput): Promise<void> {
	await db
		.insert(mods)
		.values(input)
		.onConflictDoUpdate({
			target: mods.id,
			set: {
				name: input.name,
				url: input.url,
				author: input.author ?? null,
				categories: input.categories ?? null
			}
		});
}

export async function upsertMods(inputs: UpsertModInput[], executor: Executor = db): Promise<void> {
	if (inputs.length === 0) return;
	await executor
		.insert(mods)
		.values(inputs)
		.onConflictDoUpdate({
			target: mods.id,
			set: {
				name: sql`excluded.name`,
				url: sql`excluded.url`,
				author: sql`excluded.author`,
				categories: sql`excluded.categories`
			}
		});
}

export async function getMod(id: string): Promise<ModRow | undefined> {
	const rows = await db.select().from(mods).where(eq(mods.id, id)).limit(1);
	return rows[0];
}

export async function listModIds(): Promise<string[]> {
	const rows = await db.select({ id: mods.id }).from(mods);
	return rows.map((row) => row.id);
}
