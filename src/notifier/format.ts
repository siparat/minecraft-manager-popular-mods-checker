import type { TrendEvent } from './events.js';

const PERIOD_ROWS: ReadonlyArray<{
	flag: string;
	label: string;
	pick: (event: TrendEvent) => number | undefined;
}> = [
	{ flag: 'HOT_1D', label: 'за сутки', pick: (e) => e.delta1d },
	{ flag: 'HOT_7D', label: 'за неделю', pick: (e) => e.delta7d },
	{ flag: 'HOT_14D', label: 'за 2 недели', pick: (e) => e.delta14d },
	{ flag: 'HOT_30D', label: 'за месяц', pick: (e) => e.delta30d }
];

export function escapeHtml(text: string): string {
	return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

export function formatTelegramMessage(event: TrendEvent): string {
	const url = escapeHtml(event.url);
	const lines = [
		`🔥 <a href="${url}"><b>${escapeHtml(event.name)}</b></a>`,
		`Автор: ${escapeHtml(event.author)}`,
		...(event.totalDownloads !== undefined
			? [`Всего скачиваний: ${event.totalDownloads.toLocaleString('ru-RU')}`]
			: []),
		''
	];

	for (const row of PERIOD_ROWS) {
		const delta = row.pick(event);
		if (event.flags.includes(row.flag) && delta !== undefined) {
			lines.push(`📈 +${delta.toLocaleString('ru-RU')} скачиваний ${row.label}`);
		}
	}

	return lines.join('\n');
}
