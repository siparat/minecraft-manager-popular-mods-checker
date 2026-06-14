export const modSelectors = {
	name: 'h1',
	author: 'li.detail-author a.author-name',
	categories: 'section#project-categories ul.links li:not(.class-item):not(.class-divider) a'
} as const;

export const statLabels = {
	downloads: 'Total Downloads',
	created: 'Created',
	lastUpdate: 'Last Update',
	updated: 'Updated'
} as const;
