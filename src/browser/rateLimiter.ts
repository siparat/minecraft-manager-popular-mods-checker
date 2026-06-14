import { sleep } from '../utils/sleep.js';

export class RateLimiter {
	private nextAvailableAt = 0;
	private readonly intervalMs: number;

	constructor(requestsPerSecond: number) {
		this.intervalMs = requestsPerSecond > 0 ? 1000 / requestsPerSecond : 0;
	}

	async acquire(): Promise<void> {
		const now = Date.now();
		const scheduledAt = Math.max(now, this.nextAvailableAt);
		this.nextAvailableAt = scheduledAt + this.intervalMs;
		const waitMs = scheduledAt - now;
		if (waitMs > 0) await sleep(waitMs);
	}
}
