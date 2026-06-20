import { config } from '../config/index.js';
import { logger } from '../observability/logger.js';
import { CurseForgeClient } from './client.js';

export const curseforgeClient = new CurseForgeClient(
	{
		baseUrl: config.curseforge.baseUrl,
		apiKey: config.curseforge.apiKey,
		batchSize: config.curseforge.batchSize,
		retryAttempts: config.scraping.retryAttempts,
		retryBaseMs: config.scraping.retryBaseMs,
		retryMaxMs: config.scraping.retryMaxMs
	},
	logger.child({ module: 'curseforge' })
);

export { CurseForgeClient } from './client.js';
export { discoverFreshMods, MINECRAFT_GAME_ID, MOD_CLASS_ID } from './discovery.js';
export type { DiscoverySettings } from './discovery.js';
export type { ApiMod } from './types.js';
