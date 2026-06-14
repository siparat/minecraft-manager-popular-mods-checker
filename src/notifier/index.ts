import { config } from '../config/index.js';
import { logger } from '../observability/logger.js';
import { NotificationGate } from './gate.js';

export const notificationGate = new NotificationGate(
	config.notifications.dedupHours,
	logger.child({ module: 'notifier' })
);

export { NotificationGate } from './gate.js';
export type { TrendEvent } from './events.js';
