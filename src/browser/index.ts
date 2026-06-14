import { config } from '../config/index.js';
import { logger } from '../observability/logger.js';
import { BrowserPool } from './pool.js';
import { HtmlCache } from './cache.js';
import { RateLimiter } from './rateLimiter.js';
import { PlaywrightFetcher } from './fetcher.js';

export const browserPool = new BrowserPool({ headless: config.scraping.headless });

export const rateLimiter = new RateLimiter(config.scraping.requestsPerSecond);

export const htmlCache = new HtmlCache();

export const pageFetcher = new PlaywrightFetcher(
	browserPool,
	rateLimiter,
	htmlCache,
	{
		jitterMinMs: config.scraping.jitterMinMs,
		jitterMaxMs: config.scraping.jitterMaxMs,
		navTimeoutMs: config.scraping.navTimeoutMs,
		retryAttempts: config.scraping.retryAttempts,
		retryBaseMs: config.scraping.retryBaseMs,
		retryMaxMs: config.scraping.retryMaxMs,
		cacheTtlMs: config.scraping.cacheTtlMs
	},
	logger.child({ module: 'fetcher' })
);

export type { PageFetcher, FetchResult, FetchOptions } from './types.js';
