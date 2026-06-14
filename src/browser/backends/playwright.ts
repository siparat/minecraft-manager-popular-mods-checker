import type { BrowserPool } from '../pool.js';
import type { FetchBackend, RawFetchResult } from './types.js';

export interface PlaywrightBackendSettings {
	navTimeoutMs: number;
}

export class PlaywrightBackend implements FetchBackend {
	readonly name = 'playwright';

	constructor(
		private readonly pool: BrowserPool,
		private readonly settings: PlaywrightBackendSettings
	) {}

	async fetch(url: string, opts: { waitFor?: string }): Promise<RawFetchResult> {
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
			return { html, status };
		} finally {
			await context.close();
		}
	}

	async close(): Promise<void> {
		await this.pool.close();
	}
}
