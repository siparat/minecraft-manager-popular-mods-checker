import { trendAnalyzer } from '../analyzer/index.js';
import { collector } from '../collector/index.js';
import { config } from '../config/index.js';
import { logger } from '../observability/logger.js';
import { notificationGate, notifierRegistry } from '../notifier/index.js';
import { parser } from '../parser/index.js';
import { snapshotService } from '../snapshot/index.js';
import { Pipeline } from './pipeline.js';
import { startScheduler } from './cron.js';

export const pipeline = new Pipeline(
	{
		collector,
		parser,
		snapshotService,
		analyzer: trendAnalyzer,
		gate: notificationGate,
		registry: notifierRegistry
	},
	{
		maxPages: config.scraping.maxPages,
		parseConcurrency: config.scraping.parseConcurrency,
		rules: config.rules
	},
	logger.child({ module: 'pipeline' })
);

export function startCron(): ReturnType<typeof startScheduler> {
	return startScheduler(pipeline, config.cron, logger.child({ module: 'cron' }));
}

export { Pipeline } from './pipeline.js';
