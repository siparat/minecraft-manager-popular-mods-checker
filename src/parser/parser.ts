import type { Logger } from 'pino';
import type { PageFetcher } from '../browser/types.js';
import type { ModCard } from '../collector/types.js';
import { parseModDetails } from './parse.js';
import { modSelectors } from './selectors.js';
import type { ModDetails, Parser } from './types.js';

export class HtmlParser implements Parser {
	constructor(
		private readonly fetcher: PageFetcher,
		private readonly logger: Logger
	) {}

	async parse(card: ModCard): Promise<ModDetails> {
		const { html } = await this.fetcher.fetchHtml(card.url, {
			waitFor: modSelectors.name
		});
		const details = parseModDetails(html, card);
		this.logger.debug({ modId: details.modId, downloads: details.totalDownloads }, 'parsed mod');
		return details;
	}
}
