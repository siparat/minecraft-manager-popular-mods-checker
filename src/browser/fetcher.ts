import type { Logger } from 'pino';
import type { BrowserPool } from './pool.js';
import type { HtmlCache } from './cache.js';
import type { RateLimiter } from './rateLimiter.js';
import { AntiBotError, withRetry } from './retry.js';
import { randomBetween, sleep } from '../utils/sleep.js';
import type { FetchOptions, FetchResult, PageFetcher } from './types.js';

export interface FetcherSettings {
	jitterMinMs: number;
	jitterMaxMs: number;
	navTimeoutMs: number;
	retryAttempts: number;
	retryBaseMs: number;
	retryMaxMs: number;
	cacheTtlMs: number;
}

const CHALLENGE_MARKERS = ['Just a moment', 'Attention Required', 'cf-browser-verification', 'Checking your browser'];

export class PlaywrightFetcher implements PageFetcher {
	constructor(
		private readonly pool: BrowserPool,
		private readonly rateLimiter: RateLimiter,
		private readonly cache: HtmlCache,
		private readonly settings: FetcherSettings,
		private readonly logger: Logger
	) {}

	async fetchHtml(url: string, opts: FetchOptions = {}): Promise<FetchResult> {
		const cached = this.cache.get(url);
		if (cached) {
			this.logger.debug({ url }, 'fetch served from cache');
			return { html: cached.html, status: cached.status, fromCache: true };
		}

		const result = await withRetry(() => this.navigate(url, opts), {
			attempts: this.settings.retryAttempts,
			baseDelayMs: this.settings.retryBaseMs,
			maxDelayMs: this.settings.retryMaxMs,
			onRetry: (error, attempt, delayMs) => {
				this.logger.warn({ url, attempt, delayMs, err: error }, 'fetch retry scheduled');
			}
		});

		const ttl = opts.cacheTtlMs ?? this.settings.cacheTtlMs;
		this.cache.set(url, result.html, result.status, ttl);
		return result;
	}

	private async navigate(url: string, opts: FetchOptions): Promise<FetchResult> {
		await this.rateLimiter.acquire();
		await sleep(randomBetween(this.settings.jitterMinMs, this.settings.jitterMaxMs));

		const startedAt = Date.now();
		const context = await this.pool.createContext();

		try {
			const page = await context.newPage();
			page.setDefaultNavigationTimeout(this.settings.navTimeoutMs);

			const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
			const status = response?.status() ?? 0;

			if (opts.waitFor) {
				await page.waitForSelector(opts.waitFor, {
					timeout: this.settings.navTimeoutMs
				});
			}

			const html = await page.content();
			this.assertNotBlocked(status, html);

			this.logger.debug({ url, status, durationMs: Date.now() - startedAt }, 'fetch completed');

			return { html, status, fromCache: false };
		} finally {
			await context.close();
		}
	}

	private assertNotBlocked(status: number, html: string): void {
		if (status === 403 || status === 429 || status === 503) {
			throw new AntiBotError(`blocked with status ${status}`, status);
		}
		const head = html.slice(0, 4000);
		if (CHALLENGE_MARKERS.some((marker) => head.includes(marker))) {
			throw new AntiBotError('anti-bot challenge detected', status);
		}
	}
}
