export interface RawFetchResult {
	html: string;
	status: number;
}

export interface FetchBackend {
	readonly name: string;
	fetch(url: string, opts: { waitFor?: string }): Promise<RawFetchResult>;
	close(): Promise<void>;
}
