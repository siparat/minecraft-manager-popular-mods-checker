import type { Logger } from 'pino';
import type { TrendEvent } from './events.js';
import type { Notifier } from './notifier.js';

export class NotifierRegistry {
	constructor(
		private readonly notifiers: Notifier[],
		private readonly logger: Logger
	) {}

	get count(): number {
		return this.notifiers.length;
	}

	async dispatch(event: TrendEvent): Promise<void> {
		if (this.notifiers.length === 0) {
			this.logger.warn({ modId: event.modId }, 'no notifiers configured');
			return;
		}

		const results = await Promise.allSettled(this.notifiers.map((notifier) => notifier.send(event)));

		results.forEach((result, index) => {
			const name = this.notifiers[index]!.name;
			if (result.status === 'rejected') {
				this.logger.error({ notifier: name, modId: event.modId, err: result.reason }, 'notifier failed');
			} else {
				this.logger.info({ notifier: name, modId: event.modId, flags: event.flags }, 'notification sent');
			}
		});
	}
}
