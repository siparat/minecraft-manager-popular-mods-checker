import { sql } from 'drizzle-orm';
import { config } from './config/index.js';
import { closeDb, db } from './db/client.js';
import { logger } from './observability/logger.js';

async function main(): Promise<void> {
	logger.info({ nodeEnv: config.nodeEnv }, 'starting popular-mods-checker');

	const result = await db.execute(sql`select 1 as ok`);
	logger.info({ result: result[0] }, 'database connection verified');

	await closeDb();
	logger.info('shutdown complete');
}

main().catch((error) => {
	logger.error({ err: error }, 'fatal error');
	process.exit(1);
});
