import type { Logger } from 'pino';
import type { PageFetcher } from '../browser/types.js';
import { parseSearchHtml } from './parse.js';
import { buildSearchUrl, searchSelectors } from './selectors.js';
import type { Collector, ModCard } from './types.js';

export interface CollectorSettings {
	pageSize: number;
	maxPages: number;
}

export class HtmlCollector implements Collector {
	constructor(
		private readonly fetcher: PageFetcher,
		private readonly settings: CollectorSettings,
		private readonly logger: Logger
	) {}

	async collectPage(page: number): Promise<ModCard[]> {
		const url = buildSearchUrl(page, this.settings.pageSize);
		const { html } = await this.fetcher.fetchHtml(url, {
			waitFor: searchSelectors.card
		});
		const cards = parseSearchHtml(html);
		this.logger.debug({ page, count: cards.length }, 'collected search page');
		return cards;
	}

	async collectAll(maxPages = this.settings.maxPages): Promise<ModCard[]> {
		const seen = new Map<string, ModCard>();

		for (let page = 1; page <= maxPages; page++) {
			let cards: ModCard[];
			try {
				cards = await this.collectPage(page);
			} catch (err) {
				this.logger.warn({ page, err }, 'page fetch failed, skipping');
				continue;
			}
			if (cards.length === 0) {
				this.logger.debug({ page }, 'empty page, stopping pagination');
				break;
			}
			for (const card of cards) {
				if (!seen.has(card.modId)) seen.set(card.modId, card);
			}
		}

		this.logger.info({ total: seen.size }, 'collection finished');
		return [...seen.values()];
	}
}
