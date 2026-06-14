import type { Logger } from 'pino';
import { getDeltas } from '../db/repositories/snapshotsRepo.js';
import type { ITrendAnalyzer, TrendResult } from './types.js';

export class TrendAnalyzer implements ITrendAnalyzer {
	constructor(private readonly logger: Logger) {}

	async analyze(modId: string): Promise<TrendResult | null> {
		const row = await getDeltas(modId);
		if (!row) return null;

		const delta = (past: number | null): number => (past === null ? 0 : Math.max(0, row.current - past));

		const result: TrendResult = {
			modId,
			delta1d: delta(row.p1),
			delta7d: delta(row.p7),
			delta14d: delta(row.p14),
			delta30d: delta(row.p30),
			flags: []
		};

		this.logger.debug(result, 'trend analyzed');
		return result;
	}

	async analyzeMany(modIds: string[]): Promise<TrendResult[]> {
		const results: TrendResult[] = [];
		for (const modId of modIds) {
			const result = await this.analyze(modId);
			if (result) results.push(result);
		}
		return results;
	}
}
