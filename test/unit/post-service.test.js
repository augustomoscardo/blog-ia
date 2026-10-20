import { before, beforeEach, describe, it, mock } from "node:test";
import assert from "node:assert/strict";

const srcUrl = (path) => new URL(`../../src/${path}`, import.meta.url).href;

describe("post-service", () => {
  const repository = {
    findAllPosts: mock.fn(),
    findPostById: mock.fn(),
    approvePost: mock.fn(),
    rejectPost: mock.fn(),
    createPost: mock.fn(async (post) => post),
  };
  const generate = mock.fn();
  let service;

  before(async () => {
    mock.module(srcUrl("repositories/post-repository.js"), { exports: repository });
    mock.module(srcUrl("mastra/index.js"), {
      exports: { mastra: { getAgentById: () => ({ generate }) } },
    });

    service = await import("../../src/services/post-service.js");
  });

  beforeEach(() => {
    for (const fn of [...Object.values(repository), generate]) {
      fn.mock.resetCalls();
    }
    generate.mock.mockImplementation(async () => ({
      object: { title: "Generated title", content: "# Generated content" },
    }));
  });

  it("createPostDraft builds a draft from the agent response", async () => {
    const draft = await service.createPostDraft("my idea");

    assert.equal(draft.title, "Generated title");
    assert.equal(draft.content, "# Generated content");
    assert.equal(typeof draft.id, "string");
    assert.ok(draft.id.length > 0);
    assert.equal(draft.published_at, null);
    assert.equal(draft.approved_at, null);
    assert.equal(draft.rejected_at, null);
    assert.ok(!Number.isNaN(Date.parse(draft.created_at)));
  });

  it("createPostDraft sends the idea in the prompt and uses structuredOutput", async () => {
    await service.createPostDraft("my idea");

    const [prompt, options] = generate.mock.calls[0].arguments;
    assert.match(prompt, /my idea/);
    assert.ok(options.structuredOutput.schema);
  });

  it("createPostDraft propagates agent errors", async () => {
    generate.mock.mockImplementation(async () => {
      throw new Error("LLM unavailable");
    });

    await assert.rejects(service.createPostDraft("x"), /LLM unavailable/);
  });

  it("createDraftAndSave persists the generated draft", async () => {
    const saved = await service.createDraftAndSave("ideia");

    assert.equal(repository.createPost.mock.callCount(), 1);
    assert.equal(repository.createPost.mock.calls[0].arguments[0].title, "Generated title");
    assert.equal(saved.title, "Generated title");
  });

  it("listPosts forwards includeAll to the repository", async () => {
    repository.findAllPosts.mock.mockImplementation(async () => []);

    await service.listPosts({ includeAll: true });
    await service.listPosts();

    assert.deepEqual(repository.findAllPosts.mock.calls[0].arguments[0], { includeAll: true });
    assert.deepEqual(repository.findAllPosts.mock.calls[1].arguments[0], { includeAll: false });
  });

  it("findPostById, approvePost and rejectPost delegate to the repository", async () => {
    repository.findPostById.mock.mockImplementation(async (id) => ({ id }));
    repository.approvePost.mock.mockImplementation(async (id) => ({ id, approved: true }));
    repository.rejectPost.mock.mockImplementation(async (id) => ({ id, rejected: true }));

    assert.deepEqual(await service.findPostById("a"), { id: "a" });
    assert.deepEqual(await service.approvePost("b"), { id: "b", approved: true });
    assert.deepEqual(await service.rejectPost("c"), { id: "c", rejected: true });
  });
});
