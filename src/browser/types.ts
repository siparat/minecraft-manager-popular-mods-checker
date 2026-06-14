export interface FetchOptions {
	waitFor?: string;
	cacheTtlMs?: number;
}

export interface FetchResult {
	html: string;
	status: number;
	fromCache: boolean;
}

export interface PageFetcher {
	fetchHtml(url: string, opts?: FetchOptions): Promise<FetchResult>;
}
