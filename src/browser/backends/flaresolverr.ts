import { request } from 'undici';
import type { FetchBackend, RawFetchResult } from './types.js';

export interface FlareSolverrSettings {
	url: string;
	maxTimeoutMs: number;
}

interface FlareSolverrResponse {
	status: string;
	message: string;
	solution?: {
		status: number;
		response: string;
	};
}

export class FlareSolverrBackend implements FetchBackend {
	readonly name = 'flaresolverr';

	constructor(private readonly settings: FlareSolverrSettings) {}

	async fetch(url: string): Promise<RawFetchResult> {
		const timeout = this.settings.maxTimeoutMs + 15000;
		const res = await request(this.settings.url, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				cmd: 'request.get',
				url,
				maxTimeout: this.settings.maxTimeoutMs
			}),
			headersTimeout: timeout,
			bodyTimeout: timeout
		});

		const json = (await res.body.json()) as FlareSolverrResponse;
		if (json.status !== 'ok' || !json.solution) {
			throw new Error(`flaresolverr failed: ${json.message}`);
		}

		return { html: json.solution.response, status: json.solution.status };
	}

	async close(): Promise<void> {}
}
