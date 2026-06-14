import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { config } from '../config/index.js';
import { logger } from '../observability/logger.js';

async function run(): Promise<void> {
	logger.info('running database migrations');
	const client = postgres(config.databaseUrl, { max: 1, onnotice: () => {} });
	try {
		await migrate(drizzle(client), { migrationsFolder: './drizzle' });
		logger.info('migrations applied');
	} finally {
		await client.end();
	}
}

run().catch((err) => {
	logger.error({ err }, 'migration failed');
	process.exit(1);
});
