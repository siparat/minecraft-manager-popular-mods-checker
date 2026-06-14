import { request } from 'undici';
import { withRetry } from '../utils/retry.js';

export interface HttpResponse {
	status: number;
	body: string;
}

export interface HttpRequestOptions {
	headers?: Record<string, string>;
	timeoutMs?: number;
	retryAttempts?: number;
	retryBaseMs?: number;
	retryMaxMs?: number;
}

const DEFAULTS = {
	timeoutMs: 10000,
	retryAttempts: 3,
	retryBaseMs: 500,
	retryMaxMs: 5000
};

export async function httpGet(url: string, opts: HttpRequestOptions = {}): Promise<HttpResponse> {
	return send(url, { method: 'GET' }, opts);
}

export async function httpPostJson(
	url: string,
	payload: unknown,
	opts: HttpRequestOptions = {}
): Promise<HttpResponse> {
	return send(
		url,
		{
			method: 'POST',
			body: JSON.stringify(payload),
			headers: { 'content-type': 'application/json' }
		},
		opts
	);
}

async function send(
	url: string,
	init: {
		method: 'GET' | 'POST';
		body?: string;
		headers?: Record<string, string>;
	},
	opts: HttpRequestOptions
): Promise<HttpResponse> {
	const attempts = opts.retryAttempts ?? DEFAULTS.retryAttempts;
	const baseDelayMs = opts.retryBaseMs ?? DEFAULTS.retryBaseMs;
	const maxDelayMs = opts.retryMaxMs ?? DEFAULTS.retryMaxMs;
	const timeoutMs = opts.timeoutMs ?? DEFAULTS.timeoutMs;

	return withRetry(
		async () => {
			const response = await request(url, {
				method: init.method,
				...(init.body === undefined ? {} : { body: init.body }),
				headers: { ...init.headers, ...opts.headers },
				headersTimeout: timeoutMs,
				bodyTimeout: timeoutMs
			});

			const body = await response.body.text();
			if (response.statusCode >= 500 || response.statusCode === 429) {
				throw new Error(`http ${response.statusCode} for ${url}`);
			}

			return { status: response.statusCode, body };
		},
		{ attempts, baseDelayMs, maxDelayMs }
	);
}
