import { config } from '../config/index.js';
import { logger } from '../observability/logger.js';
import { BrowserPool } from './pool.js';
import { HtmlCache } from './cache.js';
import { RateLimiter } from './rateLimiter.js';
import { CachingFetcher } from './fetcher.js';
import { PlaywrightBackend } from './backends/playwright.js';
import { FlareSolverrBackend } from './backends/flaresolverr.js';
import type { FetchBackend } from './backends/types.js';

function createBackend(): FetchBackend {
	if (config.scraping.fetchBackend === 'flaresolverr') {
		return new FlareSolverrBackend({
			url: config.flaresolverr.url,
			maxTimeoutMs: config.flaresolverr.maxTimeoutMs
		});
	}

	return new PlaywrightBackend(new BrowserPool({ headless: config.scraping.headless }), {
		navTimeoutMs: config.scraping.navTimeoutMs
	});
}

const backend = createBackend();

export const htmlCache = new HtmlCache();
export const rateLimiter = new RateLimiter(config.scraping.requestsPerSecond);

export const pageFetcher = new CachingFetcher(
	backend,
	rateLimiter,
	htmlCache,
	{
		jitterMinMs: config.scraping.jitterMinMs,
		jitterMaxMs: config.scraping.jitterMaxMs,
		retryAttempts: config.scraping.retryAttempts,
		retryBaseMs: config.scraping.retryBaseMs,
		retryMaxMs: config.scraping.retryMaxMs,
		cacheTtlMs: config.scraping.cacheTtlMs
	},
	logger.child({ module: 'fetcher' })
);

export async function closeFetcher(): Promise<void> {
	await backend.close();
}

export type { PageFetcher, FetchResult, FetchOptions } from './types.js';
