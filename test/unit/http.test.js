import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { parseJsonBody, sendJson } from "../../src/utils/http.js";

describe("parseJsonBody", () => {
  it("returns an empty object when there is no body", async () => {
    assert.deepEqual(await parseJsonBody(Readable.from([])), {});
  });

  it("returns an empty object when the body is only whitespace", async () => {
    assert.deepEqual(await parseJsonBody(Readable.from([Buffer.from("   ")])), {});
  });

  it("parses JSON split across multiple chunks", async () => {
    const stream = Readable.from([Buffer.from('{"idea":'), Buffer.from('"teste"}')]);

    assert.deepEqual(await parseJsonBody(stream), { idea: "teste" });
  });

  it("throws for invalid JSON", async () => {
    await assert.rejects(parseJsonBody(Readable.from([Buffer.from("{invalid")])), SyntaxError);
  });
});

describe("sendJson", () => {
  it("sets status, header and serialized body", () => {
    const headers = {};
    const response = {
      setHeader: (name, value) => {
        headers[name] = value;
      },
      end: (body) => {
        response.body = body;
      },
    };

    sendJson(response, 201, { ok: true });

    assert.equal(response.statusCode, 201);
    assert.equal(headers["Content-Type"], "application/json");
    assert.equal(response.body, JSON.stringify({ ok: true }));
  });
});
