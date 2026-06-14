import { start } from './app.js';
import { logger } from './observability/logger.js';

process.on('unhandledRejection', (reason) => {
	logger.error({ err: reason }, 'unhandled promise rejection');
});

process.on('uncaughtException', (err) => {
	logger.fatal({ err }, 'uncaught exception');
	process.exit(1);
});

start().catch((err) => {
	logger.fatal({ err }, 'fatal error during startup');
	process.exit(1);
});
