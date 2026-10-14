import http from "node:http";
import { initializeDatabase } from "./database/init.js";
import { closeDatabase } from "./database/pool.js";
import { sendJson } from "./utils/http.js";
import { createRouter } from "./utils/router.js";
import { registerPostRoutes } from "./routes/posts.js";

const { API_PORT = 3000, API_HOST = "localhost", API_PROTOCOL = "http" } = process.env;

const router = createRouter();

router.get("/", async (_request, response) => {
  sendJson(response, 200, { message: "Hello World" });
});

registerPostRoutes(router);

const server = http.createServer(async (request, response) => {
  if (await router.handle(request, response)) {
    return;
  }

  return sendJson(response, 404, { message: "Not Found" });
});

async function shutdown(signal) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    try {
      await closeDatabase();
      console.log("Database connections closed.");
      process.exit(0);
    } catch (error) {
      console.error("Error closing database connections:", error);
      process.exit(1);
    }
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

initializeDatabase()
  .then(() => {
    server.listen(API_PORT, API_HOST, () => {
      console.log(`Server is running on ${API_PROTOCOL}://${API_HOST}:${API_PORT}`);
      console.log("Press Ctrl+C to stop the server");
    });
  })
  .catch((error) => {
    console.error("Could not initialize database:", error.message || error);
    process.exit(1);
  });
