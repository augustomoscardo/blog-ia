import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
	connectionString: process.env.DATABASE_URL || undefined,
});

export async function initializeDatabase() {
	if (!process.env.DATABASE_URL) {
		throw new Error(
			'DATABASE_URL environment variable is missing. Please define it in your .env.local file.',
		);
	}

	await pool.query(`
		CREATE TABLE IF NOT EXISTS posts (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			content TEXT NOT NULL,
			published_at TIMESTAMPTZ,
			created_at TIMESTAMPTZ NOT NULL,
			approved_at TIMESTAMPTZ,
			rejected_at TIMESTAMPTZ
		);

		CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts (created_at DESC);
	`);
}

export async function closeDatabase() {
	await pool.end();
}