export interface ModCard {
	modId: string;
	name: string;
	url: string;
	author?: string;
	totalDownloads?: number;
	lastUpdated?: Date;
}

export interface Collector {
	collectPage(page: number): Promise<ModCard[]>;
	collectAll(maxPages?: number): Promise<ModCard[]>;
}
