import { randomBetween, sleep } from './sleep.js';

export interface RetryOptions {
	attempts: number;
	baseDelayMs: number;
	maxDelayMs: number;
	onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions): Promise<T> {
	let lastError: unknown;

	for (let attempt = 1; attempt <= opts.attempts; attempt++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error;
			if (attempt === opts.attempts) break;

			const backoff = opts.baseDelayMs * 2 ** (attempt - 1);
			const capped = Math.min(backoff, opts.maxDelayMs);
			const delayMs = capped + randomBetween(0, opts.baseDelayMs);
			opts.onRetry?.(error, attempt, delayMs);
			await sleep(delayMs);
		}
	}

	throw lastError;
}
