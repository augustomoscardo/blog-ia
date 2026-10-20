import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { hasValidApiKey } from "../../src/utils/auth.js";

const requestWith = (authorization) => ({
  headers: authorization === undefined ? {} : { authorization },
});

describe("hasValidApiKey", () => {
  let originalKey;

  beforeEach(() => {
    originalKey = process.env.API_KEY;
    process.env.API_KEY = "secret";
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.API_KEY;
    } else {
      process.env.API_KEY = originalKey;
    }
  });

  it("accepts a correct Bearer token", () => {
    assert.equal(hasValidApiKey(requestWith("Bearer secret")), true);
  });

  it("rejects a wrong token of the same length", () => {
    assert.equal(hasValidApiKey(requestWith("Bearer secrex")), false);
  });

  it("rejects a token of different length", () => {
    assert.equal(hasValidApiKey(requestWith("Bearer short")), false);
  });

  it("rejects a scheme other than Bearer", () => {
    assert.equal(hasValidApiKey(requestWith("Basic secret")), false);
  });

  it("rejects when there is no Authorization header", () => {
    assert.equal(hasValidApiKey(requestWith(undefined)), false);
  });

  it("rejects when Bearer has no token", () => {
    assert.equal(hasValidApiKey(requestWith("Bearer")), false);
  });

  it("rejects everything when API_KEY is not configured", () => {
    delete process.env.API_KEY;

    assert.equal(hasValidApiKey(requestWith("Bearer secret")), false);
  });
});
