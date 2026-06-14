export function parseAbsoluteDate(text: string | undefined): Date | undefined {
	if (!text) return undefined;
	const parsed = Date.parse(text);
	return Number.isNaN(parsed) ? undefined : new Date(parsed);
}

export function parseRelativeDate(text: string | undefined, now: Date = new Date()): Date | undefined {
	if (!text) return undefined;
	const match = /(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago/i.exec(text);
	if (!match) return undefined;

	const amount = Number(match[1]);
	const unit = match[2]!.toLowerCase();
	const date = new Date(now);

	switch (unit) {
		case 'second':
			date.setSeconds(date.getSeconds() - amount);
			break;
		case 'minute':
			date.setMinutes(date.getMinutes() - amount);
			break;
		case 'hour':
			date.setHours(date.getHours() - amount);
			break;
		case 'day':
			date.setDate(date.getDate() - amount);
			break;
		case 'week':
			date.setDate(date.getDate() - amount * 7);
			break;
		case 'month':
			date.setMonth(date.getMonth() - amount);
			break;
		case 'year':
			date.setFullYear(date.getFullYear() - amount);
			break;
	}

	return date;
}
