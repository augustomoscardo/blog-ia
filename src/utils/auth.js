import { timingSafeEqual } from "node:crypto";

export function hasValidApiKey(request) {
  const apiKey = process.env.API_KEY;
  const [scheme, token] = (request.headers.authorization || "").split(" ");

  if (!apiKey || scheme !== "Bearer" || !token) {
    return false;
  }

  const expected = Buffer.from(apiKey);
  const received = Buffer.from(token);

  return expected.length === received.length && timingSafeEqual(expected, received);
}
