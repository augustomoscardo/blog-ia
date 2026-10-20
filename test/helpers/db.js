import pg from "pg";

const DEFAULT_TEST_URL = "postgresql://postgres:postgres@localhost:5432/blog_test";

export const TEST_DATABASE_URL = process.env.DATABASE_URL_TEST || DEFAULT_TEST_URL;

async function ensureDatabaseExists(databaseUrl) {
  const url = new URL(databaseUrl);
  const databaseName = url.pathname.replace(/^\//, "");

  if (!/^\w+$/.test(databaseName)) {
    throw new Error(`Invalid test database name: ${databaseName}`);
  }

  url.pathname = "/postgres";
  const admin = new pg.Client({ connectionString: url.href });
  await admin.connect();

  try {
    const { rowCount } = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [
      databaseName,
    ]);

    if (rowCount === 0) {
      await admin.query(`CREATE DATABASE "${databaseName}"`);
    }
  } finally {
    await admin.end();
  }
}

/**
 * Creates the test database (if needed) and applies the migrations.
 * Must be called before importing modules that use the pool.
 */
export async function setupTestDatabase() {
  process.env.DATABASE_URL = TEST_DATABASE_URL;

  await ensureDatabaseExists(TEST_DATABASE_URL);

  const { initializeDatabase } = await import("../../src/database/init.js");
  await initializeDatabase();
}

export async function resetPosts() {
  const { pool } = await import("../../src/database/pool.js");
  await pool.query("TRUNCATE TABLE posts");
}

export async function teardownTestDatabase() {
  const { closeDatabase } = await import("../../src/database/pool.js");
  await closeDatabase();
}

export function buildPost(overrides = {}) {
  return {
    id: "post-1",
    title: "Title",
    content: "# Content",
    published_at: null,
    created_at: new Date().toISOString(),
    approved_at: null,
    rejected_at: null,
    ...overrides,
  };
}
