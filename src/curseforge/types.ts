export interface ApiMod {
	id: number;
	gameId: number;
	classId?: number;
	name: string;
	slug: string;
	downloadCount: number;
	dateReleased?: string;
	dateCreated?: string;
	dateModified?: string;
	links?: { websiteUrl?: string };
	authors?: Array<{ name?: string }>;
	categories?: Array<{ name?: string }>;
}

export interface CurseForgeSettings {
	baseUrl: string;
	apiKey: string;
	batchSize: number;
	retryAttempts: number;
	retryBaseMs: number;
	retryMaxMs: number;
}
