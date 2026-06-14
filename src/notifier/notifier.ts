import type { TrendEvent } from './events.js';

export interface Notifier {
	readonly name: string;
	send(event: TrendEvent): Promise<void>;
}
