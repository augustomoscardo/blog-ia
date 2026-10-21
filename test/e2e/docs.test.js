import { describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../../src/app.js";

describe("API Documentation (e2e)", () => {
  const server = createApp();

  describe("GET /api/docs", () => {
    it("serves Swagger UI HTML page", async () => {
      const response = await request(server).get("/api/docs");

      assert.equal(response.status, 200);
      assert.match(response.headers["content-type"], /text\/html/);
      assert.match(response.text, /<div id="swagger-ui"><\/div>/);
      assert.match(response.text, /SwaggerUIBundle/);
    });
  });

  describe("GET /api/docs/json", () => {
    it("serves the OpenAPI specification in JSON", async () => {
      const response = await request(server).get("/api/docs/json");

      assert.equal(response.status, 200);
      assert.match(response.headers["content-type"], /application\/json/);
      assert.equal(typeof response.body, "object");
      assert.equal(response.body.openapi, "3.0.3");
      assert.equal(response.body.info.title, "Blog IA API");
      assert.ok(response.body.paths["/posts"]);
      assert.ok(response.body.paths["/posts/{id}"]);
      assert.ok(response.body.paths["/posts/draft"]);
    });
  });
});
