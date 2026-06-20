import type { Logger } from 'pino';
import { db } from '../db/client.js';
import { upsertMods, type UpsertModInput } from '../db/repositories/modsRepo.js';
import { getLatestTimes, insertSnapshots } from '../db/repositories/snapshotsRepo.js';
import type { NewSnapshotRow } from '../db/schema.js';
import type { ModDetails } from '../parser/types.js';

export interface SaveResult {
	mods: number;
	snapshots: number;
	skipped: number;
}

export class SnapshotService {
	constructor(
		private readonly minIntervalMs: number,
		private readonly logger: Logger
	) {}

	async save(details: ModDetails): Promise<SaveResult> {
		return this.saveMany([details]);
	}

	async saveMany(detailsList: ModDetails[]): Promise<SaveResult> {
		if (detailsList.length === 0) {
			return { mods: 0, snapshots: 0, skipped: 0 };
		}

		const snapshotAt = new Date();
		const candidates = await this.filterRecent(detailsList, snapshotAt);
		const skipped = detailsList.length - candidates.length;

		if (candidates.length === 0) {
			this.logger.debug({ skipped }, 'all snapshots skipped as too recent');
			return { mods: 0, snapshots: 0, skipped };
		}

		const modRows: UpsertModInput[] = candidates.map((details) => ({
			id: details.modId,
			projectId: details.projectId ?? null,
			name: details.name,
			url: details.url,
			author: details.author,
			categories: details.categories,
			releaseDate: details.releaseDate
		}));

		const snapshotRows: NewSnapshotRow[] = candidates.map((details) => ({
			modId: details.modId,
			snapshotAt,
			downloads: details.totalDownloads
		}));

		await db.transaction(async (tx) => {
			await upsertMods(modRows, tx);
			await insertSnapshots(snapshotRows, tx);
		});

		this.logger.info({ mods: modRows.length, snapshots: snapshotRows.length, skipped }, 'snapshots saved');
		return { mods: modRows.length, snapshots: snapshotRows.length, skipped };
	}

	private async filterRecent(detailsList: ModDetails[], now: Date): Promise<ModDetails[]> {
		if (this.minIntervalMs <= 0) return detailsList;

		const cutoff = now.getTime() - this.minIntervalMs;
		const latest = await getLatestTimes(detailsList.map((d) => d.modId));

		return detailsList.filter((details) => {
			const last = latest.get(details.modId);
			return last === undefined || last.getTime() <= cutoff;
		});
	}
}
