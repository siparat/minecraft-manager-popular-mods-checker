import { chromium, type Browser, type BrowserContext, type LaunchOptions } from 'playwright';
import { randomUserAgent } from './userAgents.js';

export interface BrowserPoolOptions {
	headless: boolean;
	launchOptions?: LaunchOptions;
}

export class BrowserPool {
	private browser: Browser | undefined;
	private launching: Promise<Browser> | undefined;

	constructor(private readonly options: BrowserPoolOptions) {}

	private async getBrowser(): Promise<Browser> {
		if (this.browser?.isConnected()) return this.browser;
		if (this.launching) return this.launching;

		this.launching = chromium
			.launch({
				headless: this.options.headless,
				args: ['--disable-blink-features=AutomationControlled'],
				...this.options.launchOptions
			})
			.then((browser) => {
				this.browser = browser;
				this.launching = undefined;
				return browser;
			});

		return this.launching;
	}

	async createContext(): Promise<BrowserContext> {
		const browser = await this.getBrowser();
		const context = await browser.newContext({
			userAgent: randomUserAgent(),
			viewport: { width: 1920, height: 1080 },
			locale: 'en-US',
			timezoneId: 'UTC',
			extraHTTPHeaders: {
				'accept-language': 'en-US,en;q=0.9'
			}
		});

		await context.addInitScript(() => {
			Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
		});

		return context;
	}

	async close(): Promise<void> {
		const browser = this.browser;
		this.browser = undefined;
		if (browser?.isConnected()) await browser.close();
	}
}
