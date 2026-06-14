import type { ModCard } from '../collector/types.js';

export interface ModDetails {
	modId: string;
	name: string;
	url: string;
	author: string;
	categories: string[];
	totalDownloads: number;
	followers?: number;
	lastUpdated: Date;
	createdAt?: Date;
}

export interface Parser {
	parse(card: ModCard): Promise<ModDetails>;
}
