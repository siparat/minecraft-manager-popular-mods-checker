export class AntiBotError extends Error {
	constructor(
		message: string,
		readonly status: number
	) {
		super(message);
		this.name = 'AntiBotError';
	}
}

export { withRetry } from '../utils/retry.js';
export type { RetryOptions } from '../utils/retry.js';
