import { closeFetcher } from './browser/index.js';
import { config } from './config/index.js';
import { closeDb } from './db/client.js';
import { logger } from './observability/logger.js';
import type { ScheduledJobs } from './scheduler/cron.js';
import { pipeline, startCron } from './scheduler/index.js';

export type RunMode = 'serve' | 'fresh-once';

const SHUTDOWN_TIMEOUT_MS = 20000;

let shuttingDown = false;

export function resolveMode(argv: readonly string[]): RunMode {
	const value = argv[2] ?? process.env.RUN_MODE ?? 'serve';
	if (value === 'serve' || value === 'fresh-once') {
		return value;
	}
	throw new Error(`unknown run mode: ${value}`);
}

async function closeResources(): Promise<void> {
	await closeFetcher();
	await closeDb();
}

export async function start(): Promise<void> {
	const mode = resolveMode(process.argv);
	logger.info({ mode, nodeEnv: config.nodeEnv }, 'starting popular-mods-checker');

	if (mode === 'fresh-once') {
		await pipeline.runFreshCycle();
		await closeResources();
		return;
	}

	const scheduler = startCron();
	process.once('SIGINT', () => void shutdown(scheduler, 'SIGINT'));
	process.once('SIGTERM', () => void shutdown(scheduler, 'SIGTERM'));
}

async function shutdown(scheduler: ScheduledJobs, signal: string): Promise<void> {
	if (shuttingDown) return;
	shuttingDown = true;
	logger.info({ signal }, 'shutdown requested');

	const timer = setTimeout(() => {
		logger.error('graceful shutdown timed out, forcing exit');
		process.exit(1);
	}, SHUTDOWN_TIMEOUT_MS);
	timer.unref();

	try {
		scheduler.stop();
		await scheduler.drain();
		await closeResources();
		logger.info('shutdown complete');
		process.exit(0);
	} catch (err) {
		logger.error({ err }, 'error during shutdown');
		process.exit(1);
	}
}
