import type { Logger } from 'pino';
import type { ModDetails } from '../parser/types.js';
import type { CurseForgeClient } from './client.js';
import type { ApiMod } from './types.js';

export const MINECRAFT_GAME_ID = 432;
export const MOD_CLASS_ID = 6;

export interface DiscoverySettings {
	maxAgeMs: number;
	minDownloads: number;
	windowSize: number;
}

function releaseTimestamp(mod: ApiMod): number | null {
	const value = mod.dateReleased ?? mod.dateCreated;
	if (!value) return null;
	const parsed = Date.parse(value);
	return Number.isNaN(parsed) ? null : parsed;
}

function createdTimestamp(mod: ApiMod): number | null {
	if (!mod.dateCreated) return null;
	const parsed = Date.parse(mod.dateCreated);
	return Number.isNaN(parsed) ? null : parsed;
}

export function toModDetails(mod: ApiMod): ModDetails | null {
	const release = releaseTimestamp(mod);
	if (release === null || typeof mod.downloadCount !== 'number') return null;

	const author = mod.authors?.[0]?.name ?? '';
	const categories = (mod.categories ?? [])
		.map((category) => category.name)
		.filter((name): name is string => Boolean(name));

	return {
		modId: mod.slug,
		projectId: mod.id,
		name: mod.name,
		url: mod.links?.websiteUrl ?? `https://www.curseforge.com/minecraft/mc-mods/${mod.slug}`,
		author,
		categories,
		totalDownloads: mod.downloadCount,
		releaseDate: new Date(release),
		...(mod.dateModified ? { updateDate: new Date(mod.dateModified) } : {})
	};
}

function descendingRange(from: number, count: number): number[] {
	const ids: number[] = [];
	for (let id = from; id > from - count && id > 0; id--) ids.push(id);
	return ids;
}

export async function findMaxModId(client: CurseForgeClient, windowSize: number): Promise<number> {
	const featured = await client.getFeatured(MINECRAFT_GAME_ID);
	let max = featured.reduce((highest, mod) => Math.max(highest, mod.id), 1);

	for (;;) {
		const ids = Array.from({ length: windowSize }, (_, i) => max + 1 + i);
		const mods = await client.getMods(ids);
		if (mods.length === 0) break;
		max = mods.reduce((highest, mod) => Math.max(highest, mod.id), max);
	}

	return max;
}

export async function discoverFreshMods(
	client: CurseForgeClient,
	settings: DiscoverySettings,
	logger: Logger
): Promise<ModDetails[]> {
	const cutoff = Date.now() - settings.maxAgeMs;
	const maxId = await findMaxModId(client, settings.windowSize);
	logger.info({ maxId }, 'discovery: resolved max mod id');

	const details: ModDetails[] = [];
	for (let from = maxId; from > 0; from -= settings.windowSize) {
		const mods = await client.getMods(descendingRange(from, settings.windowSize));
		if (mods.length === 0) continue;

		for (const mod of mods) {
			if (mod.gameId !== MINECRAFT_GAME_ID || mod.classId !== MOD_CLASS_ID) continue;
			const release = releaseTimestamp(mod);
			if (release === null || release < cutoff) continue;
			if (mod.downloadCount < settings.minDownloads) continue;
			const detail = toModDetails(mod);
			if (detail) details.push(detail);
		}

		const newestCreated = mods.reduce((newest, mod) => Math.max(newest, createdTimestamp(mod) ?? 0), 0);
		if (newestCreated > 0 && newestCreated < cutoff) break;
	}

	logger.info({ found: details.length }, 'discovery: fresh mods collected');
	return details;
}
