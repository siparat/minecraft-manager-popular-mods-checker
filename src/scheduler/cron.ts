import cron, { type ScheduledTask } from 'node-cron';
import type { Logger } from 'pino';
import type { Pipeline } from './pipeline.js';

export interface CronSettings {
	collect: string;
	analyze: string;
}

export interface ScheduledJobs {
	stop(): void;
	drain(): Promise<void>;
}

export function startScheduler(pipeline: Pipeline, settings: CronSettings, logger: Logger): ScheduledJobs {
	for (const expression of [settings.collect, settings.analyze]) {
		if (!cron.validate(expression)) {
			throw new Error(`invalid cron expression: ${expression}`);
		}
	}

	const inflight = new Set<Promise<unknown>>();
	const launch = (run: () => Promise<void>, label: string): void => {
		const promise = run()
			.catch((err) => logger.error({ err }, `${label} run failed`))
			.finally(() => inflight.delete(promise));
		inflight.add(promise);
	};

	const tasks: ScheduledTask[] = [
		cron.schedule(settings.collect, () => launch(() => pipeline.runCollect(), 'collect')),
		cron.schedule(settings.analyze, () => launch(() => pipeline.runAnalyze(), 'analyze'))
	];

	logger.info({ collect: settings.collect, analyze: settings.analyze }, 'scheduler started');

	return {
		stop(): void {
			for (const task of tasks) task.stop();
			logger.info('scheduler stopped');
		},
		async drain(): Promise<void> {
			await Promise.allSettled([...inflight]);
		}
	};
}
