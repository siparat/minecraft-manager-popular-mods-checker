import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';
import type { ModCard } from '../collector/types.js';
import { parseAbsoluteDate, parseRelativeDate } from '../utils/date.js';
import { parseCompactNumber } from '../utils/number.js';
import { modSelectors, statLabels } from './selectors.js';
import type { ModDetails } from './types.js';

export class ModParseError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ModParseError';
	}
}

function statByLabel($: CheerioAPI, label: string): string | undefined {
	let value: string | undefined;
	$('dt').each((_, element) => {
		if ($(element).text().trim() === label) {
			value = $(element).next('dd').text().trim();
			return false;
		}
		return undefined;
	});
	return value;
}

export function parseModDetails(html: string, card: ModCard): ModDetails {
	const $ = cheerio.load(html);

	const name = $(modSelectors.name).first().text().trim() || card.name;
	const author = $(modSelectors.author).first().text().trim() || card.author || '';

	const categories: string[] = [];
	$(modSelectors.categories).each((_, element) => {
		const text = $(element).text().trim();
		if (text) categories.push(text);
	});

	const downloadsText = statByLabel($, statLabels.downloads);
	const totalDownloads = downloadsText ? parseCompactNumber(downloadsText) : undefined;
	if (totalDownloads === undefined || totalDownloads <= 0) {
		throw new ModParseError(`downloads not found for ${card.modId} (${card.url})`);
	}

	const lastUpdated =
		parseAbsoluteDate(statByLabel($, statLabels.lastUpdate)) ??
		parseRelativeDate(statByLabel($, statLabels.updated));
	if (!lastUpdated) {
		throw new ModParseError(`lastUpdated not found for ${card.modId}`);
	}

	const createdAt = parseRelativeDate(statByLabel($, statLabels.created));

	return {
		modId: card.modId,
		name,
		url: card.url,
		author,
		categories,
		totalDownloads,
		lastUpdated,
		...(createdAt ? { createdAt } : {})
	};
}
