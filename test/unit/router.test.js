import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createRouter } from "../../src/utils/router.js";

function fakeRequest(method, url) {
  return { method, url };
}

describe("router", () => {
  it("returns false when no route matches", async () => {
    const router = createRouter();

    assert.equal(await router.handle(fakeRequest("GET", "/nada"), {}), false);
  });

  it("runs the handler of the matching route", async () => {
    const router = createRouter();
    let called = false;
    router.get("/ping", async () => {
      called = true;
    });

    assert.equal(await router.handle(fakeRequest("GET", "/ping"), {}), true);
    assert.equal(called, true);
  });

  it("distinguishes routes by HTTP method", async () => {
    const router = createRouter();
    router.get("/items", async () => {});

    assert.equal(await router.handle(fakeRequest("POST", "/items"), {}), false);
  });

  it("extracts route params and decodes values", async () => {
    const router = createRouter();
    let params;
    router.get("/posts/:id/comments/:commentId", async (request) => {
      params = request.params;
    });

    await router.handle(fakeRequest("GET", "/posts/a%20b/comments/42"), {});

    assert.deepEqual(params, { id: "a b", commentId: "42" });
  });

  it("ignores the query string when matching routes", async () => {
    const router = createRouter();
    router.get("/posts", async () => {});

    assert.equal(await router.handle(fakeRequest("GET", "/posts?include=all"), {}), true);
  });

  it("does not match routes partially", async () => {
    const router = createRouter();
    router.get("/posts", async () => {});

    assert.equal(await router.handle(fakeRequest("GET", "/posts/extra"), {}), false);
  });

  it("supports post, patch and delete", async () => {
    const router = createRouter();
    const calls = [];
    router.post("/x", async () => calls.push("post"));
    router.patch("/x", async () => calls.push("patch"));
    router.delete("/x", async () => calls.push("delete"));

    await router.handle(fakeRequest("POST", "/x"), {});
    await router.handle(fakeRequest("PATCH", "/x"), {});
    await router.handle(fakeRequest("DELETE", "/x"), {});

    assert.deepEqual(calls, ["post", "patch", "delete"]);
  });
});
