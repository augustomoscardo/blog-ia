import { after, before, beforeEach, describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { buildPost, resetPosts, setupTestDatabase, teardownTestDatabase } from "../helpers/db.js";

const API_KEY = "test-api-key";

describe("Posts API (e2e)", () => {
  const generate = mock.fn();
  let server;
  let repository;

  before(async () => {
    process.env.API_KEY = API_KEY;

    // The OpenAI call is replaced; everything else (HTTP, routes, database) is real.
    mock.module(new URL("../../src/mastra/index.js", import.meta.url).href, {
      namedExports: { mastra: { getAgentById: () => ({ generate }) } },
    });

    await setupTestDatabase();
    const { createApp } = await import("../../src/app.js");
    repository = await import("../../src/repositories/post-repository.js");
    server = createApp();
  });

  beforeEach(async () => {
    await resetPosts();
    generate.mock.resetCalls();
    generate.mock.mockImplementation(async () => ({
      object: { title: "Generated post", content: "# Hello" },
    }));
  });

  after(teardownTestDatabase);

  describe("GET /", () => {
    it("responds with Hello World", async () => {
      const res = await request(server).get("/");

      assert.equal(res.status, 200);
      assert.deepEqual(res.body, { message: "Hello World" });
    });
  });

  describe("unknown routes", () => {
    it("returns 404", async () => {
      const res = await request(server).get("/nao-existe");

      assert.equal(res.status, 404);
      assert.deepEqual(res.body, { message: "Not Found" });
    });
  });

  describe("POST /posts/draft", () => {
    it("generates and saves a draft (201)", async () => {
      const res = await request(server).post("/posts/draft").send({ idea: "Node.js" });

      assert.equal(res.status, 201);
      assert.equal(res.body.data.title, "Generated post");
      assert.equal(res.body.data.published_at, null);
      assert.equal(generate.mock.callCount(), 1);

      const saved = await repository.findPostById(res.body.data.id);
      assert.equal(saved.title, "Generated post");
    });

    it("accepts the /posts/drafts alias", async () => {
      const res = await request(server).post("/posts/drafts").send({ idea: "Node.js" });

      assert.equal(res.status, 201);
    });

    it("returns 400 when the idea is missing", async () => {
      const res = await request(server).post("/posts/draft").send({});

      assert.equal(res.status, 400);
      assert.deepEqual(res.body, { message: "Idea is required" });
      assert.equal(generate.mock.callCount(), 0);
    });

    it("returns 400 for invalid JSON", async (t) => {
      t.mock.method(console, "error", () => {});

      const res = await request(server)
        .post("/posts/draft")
        .set("Content-Type", "application/json")
        .send("{invalid");

      assert.equal(res.status, 400);
      assert.deepEqual(res.body, { message: "Invalid JSON" });
    });

    it("returns 500 when generation fails", async (t) => {
      generate.mock.mockImplementation(async () => {
        throw new Error("falha");
      });
      t.mock.method(console, "error", () => {});

      const res = await request(server).post("/posts/draft").send({ idea: "x" });

      assert.equal(res.status, 500);
      assert.deepEqual(res.body, { message: "Could not generate post" });
    });
  });

  describe("GET /posts", () => {
    it("lists only published posts", async () => {
      await repository.createPost(buildPost({ id: "draft" }));
      await repository.createPost(buildPost({ id: "pub" }));
      await repository.approvePost("pub");

      const res = await request(server).get("/posts");

      assert.equal(res.status, 200);
      assert.deepEqual(
        res.body.data.map((post) => post.id),
        ["pub"],
      );
    });

    it("include=all returns all posts, including drafts and rejected", async () => {
      await repository.createPost(buildPost({ id: "draft" }));
      await repository.createPost(buildPost({ id: "pub" }));
      await repository.createPost(buildPost({ id: "rej" }));
      await repository.approvePost("pub");
      await repository.rejectPost("rej");

      const res = await request(server).get("/posts?include=all");

      assert.equal(res.status, 200);
      assert.equal(res.body.data.length, 3);
    });
  });

  describe("GET /posts/:id", () => {
    it("returns the post when published and approved", async () => {
      await repository.createPost(buildPost({ id: "abc", title: "My post" }));
      await repository.approvePost("abc");

      const res = await request(server).get("/posts/abc");

      assert.equal(res.status, 200);
      assert.equal(res.body.data.title, "My post");
    });

    it("returns 404 when the post is a draft", async () => {
      await repository.createPost(buildPost({ id: "draft-post" }));

      const res = await request(server).get("/posts/draft-post");

      assert.equal(res.status, 404);
      assert.deepEqual(res.body, { message: "Post not found" });
    });

    it("returns 404 when the post is rejected", async () => {
      await repository.createPost(buildPost({ id: "rej-post" }));
      await repository.rejectPost("rej-post");

      const res = await request(server).get("/posts/rej-post");

      assert.equal(res.status, 404);
      assert.deepEqual(res.body, { message: "Post not found" });
    });

    it("returns 404 when it does not exist", async () => {
      const res = await request(server).get("/posts/nao-existe");

      assert.equal(res.status, 404);
      assert.deepEqual(res.body, { message: "Post not found" });
    });
  });

  describe("PATCH /posts/:id/approve", () => {
    it("approves the post and makes it public", async () => {
      await repository.createPost(buildPost({ id: "abc" }));

      const res = await request(server).patch("/posts/abc/approve");

      assert.equal(res.status, 200);
      assert.ok(res.body.data.approved_at);
      assert.ok(res.body.data.published_at);

      const list = await request(server).get("/posts");
      assert.equal(list.body.data.length, 1);
    });

    it("returns 404 when it does not exist", async () => {
      const res = await request(server).patch("/posts/nao-existe/approve");

      assert.equal(res.status, 404);
    });
  });

  describe("DELETE /posts/:id/reject", () => {
    it("rejects the post and removes it from the public listing", async () => {
      await repository.createPost(buildPost({ id: "abc" }));
      await repository.approvePost("abc");

      const res = await request(server).delete("/posts/abc/reject");

      assert.equal(res.status, 200);
      assert.ok(res.body.data.rejected_at);
      assert.equal(res.body.data.published_at, null);

      const list = await request(server).get("/posts");
      assert.deepEqual(list.body.data, []);
    });

    it("returns 404 when it does not exist", async () => {
      const res = await request(server).delete("/posts/nao-existe/reject");

      assert.equal(res.status, 404);
    });
  });

  it("full flow: generate, approve and publish", async () => {
    const created = await request(server).post("/posts/draft").send({ idea: "flow" });
    const { id } = created.body.data;

    assert.deepEqual((await request(server).get("/posts")).body.data, []);

    await request(server).patch(`/posts/${id}/approve`).expect(200);

    const list = await request(server).get("/posts");
    assert.deepEqual(
      list.body.data.map((post) => post.id),
      [id],
    );
  });
});
