import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
	LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

	DATABASE_URL: z.string().min(1),

	SEARCH_PAGE_SIZE: z.coerce.number().int().positive().default(50),
	MAX_PAGES: z.coerce.number().int().positive().default(20),
	HEADLESS: z
		.enum(['true', 'false'])
		.default('true')
		.transform((value) => value === 'true'),
	PARSE_CONCURRENCY: z.coerce.number().int().positive().default(2),

	REQUESTS_PER_SECOND: z.coerce.number().positive().default(1),
	JITTER_MIN_MS: z.coerce.number().int().nonnegative().default(200),
	JITTER_MAX_MS: z.coerce.number().int().nonnegative().default(800),

	NAV_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
	RETRY_ATTEMPTS: z.coerce.number().int().positive().default(5),
	RETRY_BASE_MS: z.coerce.number().int().positive().default(500),
	RETRY_MAX_MS: z.coerce.number().int().positive().default(15000),
	CACHE_TTL_MS: z.coerce.number().int().nonnegative().default(300000),

	CRON_COLLECT: z.string().min(1).default('*/10 * * * *'),
	CRON_ANALYZE: z.string().min(1).default('0 * * * *'),

	TELEGRAM_BOT_TOKEN: z.string().default(''),
	TELEGRAM_CHAT_ID: z.string().default(''),

	NOTIFY_DEDUP_HOURS: z.coerce.number().int().positive().default(48)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
	const issues = z.prettifyError(parsed.error);
	throw new Error(`Invalid environment configuration:\n${issues}`);
}

const env = parsed.data;

export const config = {
	nodeEnv: env.NODE_ENV,
	logLevel: env.LOG_LEVEL,
	isProduction: env.NODE_ENV === 'production',

	databaseUrl: env.DATABASE_URL,

	scraping: {
		searchPageSize: env.SEARCH_PAGE_SIZE,
		maxPages: env.MAX_PAGES,
		headless: env.HEADLESS,
		parseConcurrency: env.PARSE_CONCURRENCY,
		requestsPerSecond: env.REQUESTS_PER_SECOND,
		jitterMinMs: env.JITTER_MIN_MS,
		jitterMaxMs: env.JITTER_MAX_MS,
		navTimeoutMs: env.NAV_TIMEOUT_MS,
		retryAttempts: env.RETRY_ATTEMPTS,
		retryBaseMs: env.RETRY_BASE_MS,
		retryMaxMs: env.RETRY_MAX_MS,
		cacheTtlMs: env.CACHE_TTL_MS
	},

	cron: {
		collect: env.CRON_COLLECT,
		analyze: env.CRON_ANALYZE
	},

	telegram: {
		botToken: env.TELEGRAM_BOT_TOKEN,
		chatId: env.TELEGRAM_CHAT_ID,
		enabled: env.TELEGRAM_BOT_TOKEN !== '' && env.TELEGRAM_CHAT_ID !== ''
	},

	notifications: {
		dedupHours: env.NOTIFY_DEDUP_HOURS
	}
} as const;

export type Config = typeof config;
