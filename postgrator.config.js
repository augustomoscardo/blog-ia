import process from "node:process";

if (!process.env.DATABASE_URL) {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // Ignore if .env.local does not exist
  }
}

const connection = {
  host: process.env.PGHOST,
  port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
  database: process.env.PGDATABASE,
  username: process.env.PGUSER,
  password: process.env.PGPASSWORD,
};

if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    if (url.hostname) connection.host = url.hostname;
    if (url.port) connection.port = Number(url.port);
    const databaseName = url.pathname.replace(/^\//, "");
    if (databaseName) connection.database = databaseName;
    if (url.username) connection.username = decodeURIComponent(url.username);
    if (url.password) connection.password = decodeURIComponent(url.password);
    if (url.searchParams.get("sslmode") === "require") connection.ssl = true;
  } catch {
    // Ignore if DATABASE_URL is not a full URL
  }
}

export default {
  migrationPattern: "src/database/migrations/*",
  driver: "pg",
  schemaTable: "schemaversion",
  ...connection,
};
