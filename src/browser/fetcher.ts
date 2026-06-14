import type { Logger } from 'pino';
import type { FetchBackend } from './backends/types.js';
import type { HtmlCache } from './cache.js';
import type { RateLimiter } from './rateLimiter.js';
import { AntiBotError, withRetry } from './retry.js';
import { randomBetween, sleep } from '../utils/sleep.js';
import type { FetchOptions, FetchResult, PageFetcher } from './types.js';

export interface FetcherSettings {
	jitterMinMs: number;
	jitterMaxMs: number;
	retryAttempts: number;
	retryBaseMs: number;
	retryMaxMs: number;
	cacheTtlMs: number;
}

const CHALLENGE_MARKERS = [
	'Just a moment',
	'Один момент',
	'Attention Required',
	'cf-browser-verification',
	'challenge-platform'
];

export class CachingFetcher implements PageFetcher {
	constructor(
		private readonly backend: FetchBackend,
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

		const result = await withRetry(() => this.load(url, opts), {
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

	private async load(url: string, opts: FetchOptions): Promise<FetchResult> {
		await this.rateLimiter.acquire();
		await sleep(randomBetween(this.settings.jitterMinMs, this.settings.jitterMaxMs));

		const startedAt = Date.now();
		const waitOpts = opts.waitFor === undefined ? {} : { waitFor: opts.waitFor };
		const { html, status } = await this.backend.fetch(url, waitOpts);
		this.assertNotBlocked(status, html);

		this.logger.debug(
			{ url, status, backend: this.backend.name, durationMs: Date.now() - startedAt },
			'fetch completed'
		);

		return { html, status, fromCache: false };
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
