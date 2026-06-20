import { trendAnalyzer } from '../analyzer/index.js';
import { config } from '../config/index.js';
import { curseforgeClient } from '../curseforge/index.js';
import { logger } from '../observability/logger.js';
import { notificationGate, notifierRegistry } from '../notifier/index.js';
import { snapshotService } from '../snapshot/index.js';
import { Pipeline } from './pipeline.js';
import { startScheduler } from './cron.js';

export const pipeline = new Pipeline(
	{
		client: curseforgeClient,
		snapshotService,
		analyzer: trendAnalyzer,
		gate: notificationGate,
		registry: notifierRegistry
	},
	{
		discovery: {
			maxAgeMs: config.newMod.maxAgeDays * 24 * 60 * 60 * 1000,
			minDownloads: config.newMod.minDownloads,
			windowSize: config.curseforge.batchSize
		},
		rules: config.rules
	},
	logger.child({ module: 'pipeline' })
);

export function startCron(): ReturnType<typeof startScheduler> {
	return startScheduler(pipeline, config.cron, logger.child({ module: 'cron' }));
}

export { Pipeline } from './pipeline.js';
