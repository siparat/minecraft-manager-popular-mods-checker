export interface ModCard {
	modId: string;
	name: string;
	url: string;
	author?: string;
	projectId?: number;
	totalDownloads?: number;
	releaseDate?: Date;
	updateDate?: Date;
	categories?: string[];
}

export interface Collector {
	collectPage(page: number): Promise<ModCard[]>;
	collectAll(maxPages?: number): Promise<ModCard[]>;
}
