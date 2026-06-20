import cron, { type ScheduledTask } from 'node-cron';
import type { Logger } from 'pino';
import type { Pipeline } from './pipeline.js';

export interface CronSettings {
	fresh: string;
	runOnStart: boolean;
}

export interface ScheduledJobs {
	stop(): void;
	drain(): Promise<void>;
}

export function startScheduler(pipeline: Pipeline, settings: CronSettings, logger: Logger): ScheduledJobs {
	if (!cron.validate(settings.fresh)) {
		throw new Error(`invalid cron expression: ${settings.fresh}`);
	}

	const inflight = new Set<Promise<unknown>>();
	const launch = (run: () => Promise<void>, label: string): void => {
		const promise = run()
			.catch((err) => logger.error({ err }, `${label} run failed`))
			.finally(() => inflight.delete(promise));
		inflight.add(promise);
	};

	const tasks: ScheduledTask[] = [
		cron.schedule(settings.fresh, () => launch(() => pipeline.runFreshCycle(), 'fresh'))
	];

	logger.info({ fresh: settings.fresh }, 'scheduler started');

	if (settings.runOnStart) {
		logger.info('running pipeline on startup');
		launch(() => pipeline.runFreshCycle(), 'startup');
	}

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
