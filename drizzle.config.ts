import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

const url = config().parsed?.DATABASE_URL;

export default defineConfig({
	schema: './src/db/schema.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		url: url ?? ''
	},
	verbose: true,
	strict: true
});
