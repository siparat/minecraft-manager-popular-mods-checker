export function parseCompactNumber(input: string): number | undefined {
	const cleaned = input.trim().replace(/,/g, '');
	const match = /^([\d.]+)\s*([kmb])?$/i.exec(cleaned);
	if (!match) return undefined;

	const value = Number.parseFloat(match[1]!);
	if (Number.isNaN(value)) return undefined;

	const suffix = match[2]?.toLowerCase();
	const factor = suffix === 'k' ? 1e3 : suffix === 'm' ? 1e6 : suffix === 'b' ? 1e9 : 1;

	return Math.round(value * factor);
}
