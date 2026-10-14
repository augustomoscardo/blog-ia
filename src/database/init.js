import path from "node:path";
import Postgrator from "postgrator";
import { pool, closeDatabase } from "./pool.js";

export async function initializeDatabase(target = "") {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL environment variable is missing. Please define it in your .env.local file.",
    );
  }

  const postgrator = new Postgrator({
    migrationPattern: path.join(import.meta.dirname, "migrations/*"),
    driver: "pg",
    execQuery: (query) => pool.query(query),
    execSqlScript: (sqlScript) => pool.query(sqlScript),
  });

  return postgrator.migrate(target);
}

export { closeDatabase } from "./pool.js";

if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) {
  const target = process.argv[2] ?? "";

  initializeDatabase(target)
    .then(async (appliedMigrations) => {
      if (appliedMigrations?.length > 0) {
        console.log(
          `Database migrated successfully. Applied ${appliedMigrations.length} migration(s):`,
        );
        appliedMigrations.forEach((m) => console.log(` - ${m.name || m.filename}`));
      } else {
        console.log("Database is already up to date. No migrations applied.");
      }
      await closeDatabase();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error("Failed to run database migrations:", error.message || error);
      await closeDatabase();
      process.exit(1);
    });
}
