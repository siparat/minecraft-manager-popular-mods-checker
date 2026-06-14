export const BASE_URL = 'https://www.curseforge.com';

export const searchSelectors = {
	card: 'div.project-card',
	nameLink: 'a.name',
	author: 'a.author-name',
	downloads: 'li.detail-downloads'
} as const;

export function buildSearchUrl(page: number, pageSize: number): string {
	return `${BASE_URL}/minecraft/search?class=mc-mods&pageSize=${pageSize}&page=${page}`;
}

export function toAbsoluteUrl(href: string): string {
	return href.startsWith('http') ? href : `${BASE_URL}${href}`;
}

export function extractModSlug(href: string): string | undefined {
	const match = /\/minecraft\/mc-mods\/([^/?#]+)/.exec(href);
	return match?.[1];
}
