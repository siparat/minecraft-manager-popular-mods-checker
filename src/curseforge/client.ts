import type { Logger } from 'pino';
import { withRetry } from '../utils/retry.js';
import type { ApiMod, CurseForgeSettings } from './types.js';

interface FeaturedResponse {
	data: {
		featured?: ApiMod[];
		popular?: ApiMod[];
		recentlyUpdated?: ApiMod[];
	};
}

export class CurseForgeClient {
	constructor(
		private readonly settings: CurseForgeSettings,
		private readonly logger: Logger
	) {}

	async getMods(ids: number[]): Promise<ApiMod[]> {
		const out: ApiMod[] = [];
		for (let offset = 0; offset < ids.length; offset += this.settings.batchSize) {
			const chunk = ids.slice(offset, offset + this.settings.batchSize);
			const res = await this.post<{ data: ApiMod[] }>('/v1/mods', { modIds: chunk });
			out.push(...(res?.data ?? []));
		}
		return out;
	}

	async getFeatured(gameId: number): Promise<ApiMod[]> {
		const res = await this.post<FeaturedResponse>('/v1/mods/featured', {
			gameId,
			excludedModIds: [],
			gameVersionTypeId: null
		});
		const data = res?.data ?? {};
		return [...(data.featured ?? []), ...(data.popular ?? []), ...(data.recentlyUpdated ?? [])];
	}

	private async post<T>(path: string, body: unknown): Promise<T | null> {
		return withRetry(
			async () => {
				const res = await fetch(this.settings.baseUrl + path, {
					method: 'POST',
					headers: {
						accept: 'application/json',
						'content-type': 'application/json',
						'x-api-key': this.settings.apiKey
					},
					body: JSON.stringify(body)
				});
				if (res.status === 404) return null;
				if (res.ok) return (await res.json()) as T;
				const detail = (await res.text()).slice(0, 160);
				throw new Error(`curseforge ${path} http ${res.status}: ${detail}`);
			},
			{
				attempts: this.settings.retryAttempts,
				baseDelayMs: this.settings.retryBaseMs,
				maxDelayMs: this.settings.retryMaxMs,
				onRetry: (error, attempt, delayMs) =>
					this.logger.warn({ path, attempt, delayMs, err: error }, 'curseforge retry scheduled')
			}
		);
	}
}
