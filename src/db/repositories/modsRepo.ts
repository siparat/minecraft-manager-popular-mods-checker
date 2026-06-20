import { eq, sql } from 'drizzle-orm';
import { db, type Executor } from '../client.js';
import { mods, type ModRow, type NewModRow } from '../schema.js';

export type UpsertModInput = Pick<
	NewModRow,
	'id' | 'projectId' | 'name' | 'url' | 'author' | 'categories' | 'releaseDate'
>;

export async function upsertMods(inputs: UpsertModInput[], executor: Executor = db): Promise<void> {
	if (inputs.length === 0) return;
	await executor
		.insert(mods)
		.values(inputs)
		.onConflictDoUpdate({
			target: mods.id,
			set: {
				projectId: sql`excluded.project_id`,
				name: sql`excluded.name`,
				url: sql`excluded.url`,
				author: sql`excluded.author`,
				categories: sql`excluded.categories`,
				releaseDate: sql`excluded.release_date`
			}
		});
}

export async function getMod(id: string): Promise<ModRow | undefined> {
	const rows = await db.select().from(mods).where(eq(mods.id, id)).limit(1);
	return rows[0];
}

export async function countMods(): Promise<number> {
	const rows = await db.select({ value: sql<number>`count(*)::int` }).from(mods);
	return rows[0]?.value ?? 0;
}
