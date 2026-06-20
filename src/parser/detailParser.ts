import { collectObjects, reconstructFlight } from '../collector/flightParser.js';
import { toAbsoluteUrl } from '../collector/selectors.js';
import { ModParseError } from './parse.js';
import type { ModDetails } from './types.js';

const DETAIL_OBJECT_MAX_LEN = 500000;

interface RawDetail {
	id?: number;
	name?: string;
	slug?: string;
	projectOwnerName?: string;
	author?: { name?: string };
	downloads?: number;
	dateCreated?: number;
	dateModified?: number;
	categories?: Array<{ name?: string }>;
}

export function parseDetailHtml(html: string, slug: string): ModDetails {
	const flight = reconstructFlight(html);
	if (!flight.includes(`"slug":"${slug}"`)) {
		throw new ModParseError(`detail page for ${slug} not recognised (blocked or wrong page?)`);
	}

	const objects = collectObjects(
		flight,
		[`"slug":"${slug}"`, '"downloads":', '"dateCreated":'],
		DETAIL_OBJECT_MAX_LEN
	);
	const raw = objects
		.map((object) => object as RawDetail)
		.find(
			(object) =>
				object.slug === slug && typeof object.downloads === 'number' && typeof object.dateCreated === 'number'
		);

	if (!raw || typeof raw.downloads !== 'number' || raw.downloads <= 0) {
		throw new ModParseError(`detail downloads not found for ${slug}`);
	}
	if (typeof raw.dateCreated !== 'number') {
		throw new ModParseError(`detail release date not found for ${slug}`);
	}

	const author = raw.projectOwnerName ?? raw.author?.name ?? '';
	const categories = (raw.categories ?? [])
		.map((category) => category.name)
		.filter((name): name is string => Boolean(name));

	return {
		modId: slug,
		name: raw.name ?? slug,
		url: toAbsoluteUrl(`/minecraft/mc-mods/${slug}`),
		author,
		categories,
		totalDownloads: raw.downloads,
		releaseDate: new Date(raw.dateCreated),
		...(typeof raw.dateModified === 'number' ? { updateDate: new Date(raw.dateModified) } : {})
	};
}
