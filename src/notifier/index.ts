import { config } from '../config/index.js';
import { logger } from '../observability/logger.js';
import { NotificationGate } from './gate.js';
import type { Notifier } from './notifier.js';
import { NotifierRegistry } from './registry.js';
import { TelegramNotifier } from './telegram.js';

export const notificationGate = new NotificationGate(
	config.notifications.dedupHours,
	logger.child({ module: 'notifier' })
);

const notifiers: Notifier[] = [];

if (config.telegram.enabled) {
	notifiers.push(
		new TelegramNotifier(
			config.telegram.botToken,
			config.telegram.chatId,
			config.telegram.topicId,
			logger.child({ module: 'telegram' })
		)
	);
}

export const notifierRegistry = new NotifierRegistry(notifiers, logger.child({ module: 'notifier' }));

export type { TrendEvent } from './events.js';
export { formatTelegramMessage } from './format.js';
export { NotificationGate } from './gate.js';
export type { Notifier } from './notifier.js';
export { NotifierRegistry } from './registry.js';
export { TelegramNotifier } from './telegram.js';
