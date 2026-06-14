import { and, desc, eq, inArray, lte, max, sql } from 'drizzle-orm';
import { db, type Executor } from '../client.js';
import { modSnapshots, type NewSnapshotRow, type SnapshotRow } from '../schema.js';

export interface DeltaRow {
	current: number;
	currentAt: Date;
	p1: number | null;
	p7: number | null;
	p14: number | null;
	p30: number | null;
}

function toNumberOrNull(value: unknown): number | null {
	return value === null || value === undefined ? null : Number(value);
}

export async function getDeltas(modId: string): Promise<DeltaRow | undefined> {
	const result = await db.execute(sql`
		SELECT
			c.downloads AS current,
			c.snapshot_at AS current_at,
			p1.downloads AS p1,
			p7.downloads AS p7,
			p14.downloads AS p14,
			p30.downloads AS p30
		FROM mod_snapshots c
		LEFT JOIN LATERAL (
			SELECT downloads FROM mod_snapshots p
			WHERE p.mod_id = c.mod_id AND p.snapshot_at <= now() - interval '1 day'
			ORDER BY p.snapshot_at DESC LIMIT 1
		) p1 ON true
		LEFT JOIN LATERAL (
			SELECT downloads FROM mod_snapshots p
			WHERE p.mod_id = c.mod_id AND p.snapshot_at <= now() - interval '7 days'
			ORDER BY p.snapshot_at DESC LIMIT 1
		) p7 ON true
		LEFT JOIN LATERAL (
			SELECT downloads FROM mod_snapshots p
			WHERE p.mod_id = c.mod_id AND p.snapshot_at <= now() - interval '14 days'
			ORDER BY p.snapshot_at DESC LIMIT 1
		) p14 ON true
		LEFT JOIN LATERAL (
			SELECT downloads FROM mod_snapshots p
			WHERE p.mod_id = c.mod_id AND p.snapshot_at <= now() - interval '30 days'
			ORDER BY p.snapshot_at DESC LIMIT 1
		) p30 ON true
		WHERE c.mod_id = ${modId}
		ORDER BY c.snapshot_at DESC
		LIMIT 1
	`);

	const row = (result as unknown as Record<string, unknown>[])[0];
	if (!row) return undefined;

	return {
		current: Number(row.current),
		currentAt: row.current_at instanceof Date ? row.current_at : new Date(String(row.current_at)),
		p1: toNumberOrNull(row.p1),
		p7: toNumberOrNull(row.p7),
		p14: toNumberOrNull(row.p14),
		p30: toNumberOrNull(row.p30)
	};
}

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
