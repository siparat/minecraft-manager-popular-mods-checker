import type { ModCard } from '../collector/types.js';

export interface ModDetails {
	modId: string;
	projectId?: number;
	name: string;
	url: string;
	author: string;
	categories: string[];
	totalDownloads: number;
	releaseDate: Date;
	updateDate?: Date;
}

export interface Parser {
	parse(card: ModCard): Promise<ModDetails>;
}
