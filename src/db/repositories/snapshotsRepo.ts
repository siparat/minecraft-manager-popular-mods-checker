import { and, desc, eq, lte } from 'drizzle-orm';
import { db } from '../client.js';
import { modSnapshots, type NewSnapshotRow, type SnapshotRow } from '../schema.js';

export async function insertSnapshot(input: NewSnapshotRow): Promise<void> {
	await db.insert(modSnapshots).values(input);
}

export async function insertSnapshots(inputs: NewSnapshotRow[]): Promise<void> {
	if (inputs.length === 0) return;
	await db.insert(modSnapshots).values(inputs);
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
