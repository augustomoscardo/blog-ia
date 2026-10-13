import fs from 'node:fs/promises';
import path from 'node:path';
import { pool, closeDatabase } from './pool.js';

export async function initializeDatabase() {
	if (!process.env.DATABASE_URL) {
		throw new Error(
			'DATABASE_URL environment variable is missing. Please define it in your .env.local file.',
		);
	}

	const schemaPath = new URL('./schema.sql', import.meta.url);
	const schemaSql = await fs.readFile(schemaPath, 'utf-8');

	await pool.query(schemaSql);
}

export { closeDatabase } from './pool.js';

if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) {
	initializeDatabase()
		.then(async () => {
			console.log('Database initialized successfully.');
			await closeDatabase();
			process.exit(0);
		})
		.catch(async (error) => {
			console.error('Failed to initialize database:', error.message || error);
			await closeDatabase();
			process.exit(1);
		});
}
