interface CacheEntry {
	html: string;
	status: number;
	expiresAt: number;
}

export class HtmlCache {
	private readonly store = new Map<string, CacheEntry>();

	get(url: string): { html: string; status: number } | undefined {
		const entry = this.store.get(url);
		if (!entry) return undefined;
		if (entry.expiresAt <= Date.now()) {
			this.store.delete(url);
			return undefined;
		}
		return { html: entry.html, status: entry.status };
	}

	set(url: string, html: string, status: number, ttlMs: number): void {
		if (ttlMs <= 0) return;
		this.store.set(url, { html, status, expiresAt: Date.now() + ttlMs });
	}

	clear(): void {
		this.store.clear();
	}
}
