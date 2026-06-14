import { config } from '../config/index.js';
import { logger } from '../observability/logger.js';
import { NotificationGate } from './gate.js';
import { NotifierRegistry } from './registry.js';
import { TelegramNotifier } from './telegram.js';
import type { Notifier } from './notifier.js';

export const notificationGate = new NotificationGate(
	config.notifications.dedupHours,
	logger.child({ module: 'notifier' })
);

const notifiers: Notifier[] = [];

if (config.telegram.enabled) {
	notifiers.push(
		new TelegramNotifier(config.telegram.botToken, config.telegram.chatId, logger.child({ module: 'telegram' }))
	);
}

export const notifierRegistry = new NotifierRegistry(notifiers, logger.child({ module: 'notifier' }));

export { NotificationGate } from './gate.js';
export { NotifierRegistry } from './registry.js';
export { TelegramNotifier } from './telegram.js';
export { formatTelegramMessage } from './format.js';
export type { Notifier } from './notifier.js';
export type { TrendEvent } from './events.js';
