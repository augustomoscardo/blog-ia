import http from "node:http";
import { sendJson } from "./utils/http.js";
import { createRouter } from "./utils/router.js";
import { registerPostRoutes } from "./routes/posts.js";

export function createApp() {
  const router = createRouter();

  router.get("/", async (_request, response) => {
    sendJson(response, 200, { message: "Hello World" });
  });

  registerPostRoutes(router);

  return http.createServer(async (request, response) => {
    if (await router.handle(request, response)) {
      return;
    }

    return sendJson(response, 404, { message: "Not Found" });
  });
}
