import { extractSearchMods } from './flightParser.js';
import type { ModCard } from './types.js';

export function parseSearchHtml(html: string): ModCard[] {
	return extractSearchMods(html);
}
