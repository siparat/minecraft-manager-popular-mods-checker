import type { Logger } from 'pino';
import type { ModCard } from '../collector/types.js';
import { ModParseError } from './parse.js';
import type { ModDetails, Parser } from './types.js';

export class CardParser implements Parser {
	constructor(private readonly logger: Logger) {}

	async parse(card: ModCard): Promise<ModDetails> {
		if (card.totalDownloads === undefined || card.totalDownloads <= 0) {
			throw new ModParseError(`downloads not found for ${card.modId} (${card.url})`);
		}
		if (!card.releaseDate) {
			throw new ModParseError(`release date not found for ${card.modId} (${card.url})`);
		}

		const details: ModDetails = {
			modId: card.modId,
			name: card.name,
			url: card.url,
			author: card.author ?? '',
			categories: card.categories ?? [],
			totalDownloads: card.totalDownloads,
			releaseDate: card.releaseDate,
			...(card.updateDate ? { updateDate: card.updateDate } : {})
		};

		this.logger.debug({ modId: details.modId, downloads: details.totalDownloads }, 'parsed mod from card');
		return details;
	}
}
