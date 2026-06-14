import cron, { type ScheduledTask } from 'node-cron';
import type { Logger } from 'pino';
import type { Pipeline } from './pipeline.js';

export interface CronSettings {
	collect: string;
	analyze: string;
}

export interface ScheduledJobs {
	stop(): void;
}

export function startScheduler(pipeline: Pipeline, settings: CronSettings, logger: Logger): ScheduledJobs {
	for (const expression of [settings.collect, settings.analyze]) {
		if (!cron.validate(expression)) {
			throw new Error(`invalid cron expression: ${expression}`);
		}
	}

	const tasks: ScheduledTask[] = [
		cron.schedule(settings.collect, () => {
			pipeline.runCollect().catch((err) => logger.error({ err }, 'collect run failed'));
		}),
		cron.schedule(settings.analyze, () => {
			pipeline.runAnalyze().catch((err) => logger.error({ err }, 'analyze run failed'));
		})
	];

	logger.info({ collect: settings.collect, analyze: settings.analyze }, 'scheduler started');

	return {
		stop(): void {
			for (const task of tasks) task.stop();
			logger.info('scheduler stopped');
		}
	};
}
