import { openApiSpec } from "../docs/openapi.js";
import { sendJson } from "../utils/http.js";

const SWAGGER_UI_VERSION = "5";

const swaggerHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Blog IA API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({ url: "/api/docs/json", dom_id: "#swagger-ui" });
    </script>
  </body>
</html>`;

export function registerDocsRoutes(router) {
  router.get("/api/docs", async (_request, response) => {
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.statusCode = 200;
    response.end(swaggerHtml);
  });

  router.get("/api/docs/json", async (_request, response) => {
    sendJson(response, 200, openApiSpec);
  });
}
