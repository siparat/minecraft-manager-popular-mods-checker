import type { Logger } from 'pino';
import type { ModCard } from '../collector/types.js';
import { ModParseError } from './parse.js';
import type { ModDetails, Parser } from './types.js';

// CurseForge mod detail pages sit behind a Cloudflare challenge that FlareSolverr
// cannot solve, so we build ModDetails straight from the search card, which already
// carries the download count, author and last-updated date. Categories are the only
// detail-only field we give up, and they are not persisted anyway.
export class CardParser implements Parser {
	constructor(private readonly logger: Logger) {}

	async parse(card: ModCard): Promise<ModDetails> {
		if (card.totalDownloads === undefined || card.totalDownloads <= 0) {
			throw new ModParseError(`downloads not found for ${card.modId} (${card.url})`);
		}

		const details: ModDetails = {
			modId: card.modId,
			name: card.name,
			url: card.url,
			author: card.author ?? '',
			categories: [],
			totalDownloads: card.totalDownloads,
			lastUpdated: card.lastUpdated ?? new Date()
		};

		this.logger.debug({ modId: details.modId, downloads: details.totalDownloads }, 'parsed mod from card');
		return details;
	}
}
