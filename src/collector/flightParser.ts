import type { ModCard } from './types.js';
import { toAbsoluteUrl } from './selectors.js';

export function reconstructFlight(html: string): string {
	let flight = '';
	const re = /self\.__next_f\.push\(\[1,(".*?")\]\)<\/script>/gs;
	let match: RegExpExecArray | null;
	while ((match = re.exec(html)) !== null) {
		try {
			flight += JSON.parse(match[1]!) as string;
		} catch {
			continue;
		}
	}
	return flight;
}

export function collectObjects(flight: string, markers: string[], maxLen: number): Record<string, unknown>[] {
	const out: Record<string, unknown>[] = [];
	const stack: number[] = [];
	let inStr = false;
	let esc = false;

	for (let i = 0; i < flight.length; i++) {
		const ch = flight[i];
		if (inStr) {
			if (esc) esc = false;
			else if (ch === '\\') esc = true;
			else if (ch === '"') inStr = false;
			continue;
		}
		if (ch === '"') inStr = true;
		else if (ch === '{') stack.push(i);
		else if (ch === '}') {
			const start = stack.pop();
			if (start === undefined) continue;
			if (i - start + 1 > maxLen) continue;
			const sub = flight.slice(start, i + 1);
			if (!markers.every((marker) => sub.includes(marker))) continue;
			try {
				out.push(JSON.parse(sub) as Record<string, unknown>);
			} catch {
				continue;
			}
		}
	}

	return out;
}

const SEARCH_OBJECT_MAX_LEN = 8000;

interface RawMod {
	id?: number;
	projectId?: number;
	slug?: string;
	projectSlug?: string;
	name?: string;
	projectOwnerName?: string;
	author?: { name?: string };
	downloadsCount?: number;
	creationDate?: number;
	updateDate?: number;
	categories?: Array<{ name?: string }>;
}

function toModCard(raw: RawMod): ModCard | null {
	const slug = raw.slug ?? raw.projectSlug;
	const id = raw.projectId ?? raw.id;
	if (!slug || !raw.name || typeof raw.downloadsCount !== 'number' || typeof raw.creationDate !== 'number') {
		return null;
	}

	const author = raw.projectOwnerName ?? raw.author?.name;
	const categories = (raw.categories ?? [])
		.map((category) => category.name)
		.filter((name): name is string => Boolean(name));

	return {
		modId: slug,
		name: raw.name,
		url: toAbsoluteUrl(`/minecraft/mc-mods/${slug}`),
		totalDownloads: raw.downloadsCount,
		releaseDate: new Date(raw.creationDate),
		...(author ? { author } : {}),
		...(typeof id === 'number' ? { projectId: id } : {}),
		...(typeof raw.updateDate === 'number' ? { updateDate: new Date(raw.updateDate) } : {}),
		...(categories.length > 0 ? { categories } : {})
	};
}

export function extractSearchMods(html: string): ModCard[] {
	const flight = reconstructFlight(html);
	const objects = collectObjects(flight, ['"downloadsCount":', '"creationDate":'], SEARCH_OBJECT_MAX_LEN);

	const cards: ModCard[] = [];
	const seen = new Set<string>();
	for (const raw of objects) {
		const card = toModCard(raw as RawMod);
		if (!card || seen.has(card.modId)) continue;
		seen.add(card.modId);
		cards.push(card);
	}
	return cards;
}
