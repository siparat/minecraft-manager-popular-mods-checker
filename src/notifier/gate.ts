import type { Logger } from 'pino';
import { recordSent, wasRecentlySent } from '../db/repositories/notificationsRepo.js';
import type { TrendResult } from '../analyzer/types.js';
import type { ModDetails } from '../parser/types.js';
import type { TrendEvent } from './events.js';

export class NotificationGate {
	constructor(
		private readonly dedupHours: number,
		private readonly logger: Logger
	) {}

	async build(details: ModDetails, trend: TrendResult, flags: string[]): Promise<TrendEvent | null> {
		const fresh: string[] = [];
		for (const flag of flags) {
			const sent = await wasRecentlySent(details.modId, flag, this.dedupHours);
			if (!sent) fresh.push(flag);
		}

		if (fresh.length === 0) {
			this.logger.debug({ modId: details.modId, flags }, 'all flags deduplicated, no event');
			return null;
		}

		return {
			modId: details.modId,
			name: details.name,
			url: details.url,
			author: details.author,
			delta1d: trend.delta1d,
			delta7d: trend.delta7d,
			delta14d: trend.delta14d,
			delta30d: trend.delta30d,
			flags: fresh
		};
	}

	async markSent(event: TrendEvent): Promise<void> {
		for (const flag of event.flags) {
			await recordSent(event.modId, flag);
		}
		this.logger.debug({ modId: event.modId, flags: event.flags }, 'notifications recorded');
	}
}
