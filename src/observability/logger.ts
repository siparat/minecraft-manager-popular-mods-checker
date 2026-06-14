import { pino, type LoggerOptions } from 'pino';
import { config } from '../config/index.js';

const options: LoggerOptions = { level: config.logLevel };

if (!config.isProduction) {
	options.transport = {
		target: 'pino-pretty',
		options: {
			colorize: true,
			translateTime: 'SYS:standard',
			ignore: 'pid,hostname'
		}
	};
}

export const logger = pino(options);

export type Logger = typeof logger;
