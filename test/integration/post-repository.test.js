import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildPost, resetPosts, setupTestDatabase, teardownTestDatabase } from "../helpers/db.js";

describe("post-repository (PostgreSQL)", () => {
  let repository;

  before(async () => {
    await setupTestDatabase();
    repository = await import("../../src/repositories/post-repository.js");
  });

  beforeEach(resetPosts);

  after(teardownTestDatabase);

  it("createPost inserts and returns the post", async () => {
    const created = await repository.createPost(buildPost({ id: "a", title: "Hello" }));

    assert.equal(created.id, "a");
    assert.equal(created.title, "Hello");
    assert.equal(created.published_at, null);
  });

  it("findPostById returns the existing post and undefined for a missing one", async () => {
    await repository.createPost(buildPost({ id: "a" }));

    assert.equal((await repository.findPostById("a")).id, "a");
    assert.equal(await repository.findPostById("nao-existe"), undefined);
  });

  it("approvePost sets approved_at and published_at", async () => {
    await repository.createPost(buildPost({ id: "a" }));

    const approved = await repository.approvePost("a");

    assert.ok(approved.approved_at instanceof Date);
    assert.ok(approved.published_at instanceof Date);
    assert.equal(approved.rejected_at, null);
  });

  it("rejectPost sets rejected_at and clears approval/publication", async () => {
    await repository.createPost(buildPost({ id: "a" }));
    await repository.approvePost("a");

    const rejected = await repository.rejectPost("a");

    assert.ok(rejected.rejected_at instanceof Date);
    assert.equal(rejected.approved_at, null);
    assert.equal(rejected.published_at, null);
  });

  it("approvePost and rejectPost return undefined for a missing id", async () => {
    assert.equal(await repository.approvePost("x"), undefined);
    assert.equal(await repository.rejectPost("x"), undefined);
  });

  it("findAllPosts without includeAll returns only published and non-rejected posts", async () => {
    await repository.createPost(buildPost({ id: "draft" }));
    await repository.createPost(buildPost({ id: "published" }));
    await repository.createPost(buildPost({ id: "rejected" }));
    await repository.approvePost("published");
    await repository.rejectPost("rejected");

    const posts = await repository.findAllPosts();

    assert.deepEqual(
      posts.map((post) => post.id),
      ["published"],
    );
  });

  it("findAllPosts with includeAll returns all posts, newest first", async () => {
    await repository.createPost(buildPost({ id: "old", created_at: "2026-01-01T00:00:00Z" }));
    await repository.createPost(buildPost({ id: "new", created_at: "2026-02-01T00:00:00Z" }));

    const posts = await repository.findAllPosts({ includeAll: true });

    assert.deepEqual(
      posts.map((post) => post.id),
      ["new", "old"],
    );
  });

  it("migrations create the posts table", async () => {
    const { pool } = await import("../../src/database/pool.js");
    const { rows } = await pool.query("SELECT to_regclass('public.posts') AS name");

    assert.equal(rows[0].name, "posts");
  });
});
