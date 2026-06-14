import { pageFetcher } from '../browser/index.js';
import { config } from '../config/index.js';
import { logger } from '../observability/logger.js';
import { HtmlCollector } from './collector.js';

export const collector = new HtmlCollector(
	pageFetcher,
	{
		pageSize: config.scraping.searchPageSize,
		maxPages: config.scraping.maxPages
	},
	logger.child({ module: 'collector' })
);

export { parseSearchHtml } from './parse.js';
export type { Collector, ModCard } from './types.js';
