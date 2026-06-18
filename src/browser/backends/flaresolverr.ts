import { request } from 'undici';
import type { FetchBackend, RawFetchResult } from './types.js';

export interface FlareSolverrSettings {
	url: string;
	maxTimeoutMs: number;
}

interface FlareSolverrResponse {
	status: string;
	message: string;
	session?: string;
	solution?: {
		status: number;
		response: string;
	};
}

class SessionExpiredError extends Error {}

export class FlareSolverrBackend implements FetchBackend {
	readonly name = 'flaresolverr';
	private sessionId: string | null = null;
	private sessionPromise: Promise<string> | null = null;

	constructor(private readonly settings: FlareSolverrSettings) {}

	async fetch(url: string): Promise<RawFetchResult> {
		const session = await this.ensureSession();
		try {
			return await this.requestGet(url, session);
		} catch (err) {
			if (!(err instanceof SessionExpiredError)) throw err;
			// Session was lost (e.g. FlareSolverr restarted) — recreate once and retry.
			this.sessionId = null;
			const fresh = await this.ensureSession();
			return this.requestGet(url, fresh);
		}
	}

	async close(): Promise<void> {
		if (!this.sessionId) return;
		try {
			await this.command({ cmd: 'sessions.destroy', session: this.sessionId });
		} catch {
			// best-effort cleanup; the browser session is reaped when the container stops
		}
		this.sessionId = null;
	}

	private async requestGet(url: string, session: string): Promise<RawFetchResult> {
		const json = await this.command({
			cmd: 'request.get',
			url,
			session,
			maxTimeout: this.settings.maxTimeoutMs
		});

		if (json.status !== 'ok' || !json.solution) {
			if (this.isSessionError(json.message)) throw new SessionExpiredError(json.message);
			throw new Error(`flaresolverr failed: ${json.message}`);
		}

		return { html: json.solution.response, status: json.solution.status };
	}

	// Reuse a single FlareSolverr session so the cf_clearance cookie is kept across
	// requests — only the first page pays the Cloudflare challenge, the rest skip it.
	private ensureSession(): Promise<string> {
		if (this.sessionId) return Promise.resolve(this.sessionId);
		if (!this.sessionPromise) {
			this.sessionPromise = this.createSession().finally(() => {
				this.sessionPromise = null;
			});
		}
		return this.sessionPromise;
	}

	private async createSession(): Promise<string> {
		const json = await this.command({ cmd: 'sessions.create' });
		if (json.status !== 'ok' || !json.session) {
			throw new Error(`flaresolverr session create failed: ${json.message}`);
		}
		this.sessionId = json.session;
		return json.session;
	}

	private isSessionError(message: string): boolean {
		return /session/i.test(message) && /(exist|found|invalid)/i.test(message);
	}

	private async command(body: Record<string, unknown>): Promise<FlareSolverrResponse> {
		const timeout = this.settings.maxTimeoutMs + 15000;
		const res = await request(this.settings.url, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body),
			headersTimeout: timeout,
			bodyTimeout: timeout
		});

		return (await res.body.json()) as FlareSolverrResponse;
	}
}
