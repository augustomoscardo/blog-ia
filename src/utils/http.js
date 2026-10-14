export async function parseJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  const rawBody = Buffer.concat(chunks).toString("utf-8").trim();
  if (!rawBody) {
    return {};
  }

  return JSON.parse(rawBody);
}

export function sendJson(response, statusCode, data) {
  response.setHeader("Content-Type", "application/json");
  response.statusCode = statusCode;
  response.end(JSON.stringify(data));
}
