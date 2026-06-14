import { and, desc, eq, inArray, lte, max } from 'drizzle-orm';
import { db, type Executor } from '../client.js';
import { modSnapshots, type NewSnapshotRow, type SnapshotRow } from '../schema.js';

export async function insertSnapshot(input: NewSnapshotRow): Promise<void> {
	await db.insert(modSnapshots).values(input);
}

export async function insertSnapshots(inputs: NewSnapshotRow[], executor: Executor = db): Promise<void> {
	if (inputs.length === 0) return;
	await executor.insert(modSnapshots).values(inputs);
}

export async function getLatestTimes(modIds: string[]): Promise<Map<string, Date>> {
	if (modIds.length === 0) return new Map();
	const rows = await db
		.select({ modId: modSnapshots.modId, latest: max(modSnapshots.snapshotAt) })
		.from(modSnapshots)
		.where(inArray(modSnapshots.modId, modIds))
		.groupBy(modSnapshots.modId);

	const result = new Map<string, Date>();
	for (const row of rows) {
		if (row.latest) result.set(row.modId, row.latest);
	}
	return result;
}

export async function getLatest(modId: string): Promise<SnapshotRow | undefined> {
	const rows = await db
		.select()
		.from(modSnapshots)
		.where(eq(modSnapshots.modId, modId))
		.orderBy(desc(modSnapshots.snapshotAt))
		.limit(1);
	return rows[0];
}

export async function getNearestBefore(modId: string, before: Date): Promise<SnapshotRow | undefined> {
	const rows = await db
		.select()
		.from(modSnapshots)
		.where(and(eq(modSnapshots.modId, modId), lte(modSnapshots.snapshotAt, before)))
		.orderBy(desc(modSnapshots.snapshotAt))
		.limit(1);
	return rows[0];
}
