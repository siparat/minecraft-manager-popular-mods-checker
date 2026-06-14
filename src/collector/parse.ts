import * as cheerio from 'cheerio';
import { parseCompactNumber } from '../utils/number.js';
import { extractModSlug, searchSelectors, toAbsoluteUrl } from './selectors.js';
import type { ModCard } from './types.js';

export function parseSearchHtml(html: string): ModCard[] {
	const $ = cheerio.load(html);
	const cards: ModCard[] = [];

	$(searchSelectors.card).each((_, element) => {
		const card = $(element);
		const link = card.find(searchSelectors.nameLink).first();
		const href = link.attr('href');
		if (!href) return;

		const modId = extractModSlug(href);
		if (!modId) return;

		const name = link.text().trim();
		if (!name) return;

		const author = card.find(searchSelectors.author).first().text().trim();
		const downloadsText = card.find(searchSelectors.downloads).first().text().trim();
		const totalDownloads = downloadsText ? parseCompactNumber(downloadsText) : undefined;

		cards.push({
			modId,
			name,
			url: toAbsoluteUrl(href),
			...(author ? { author } : {}),
			...(totalDownloads !== undefined ? { totalDownloads } : {})
		});
	});

	return cards;
}
