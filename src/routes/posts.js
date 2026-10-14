import { createDraftAndSave, listPosts, findPostById } from "../services/post-service.js";
import { parseJsonBody, sendJson } from "../utils/http.js";

export function registerPostRoutes(router) {
  router.get("/posts", async (_request, response) => {
    try {
      const posts = await listPosts();
      return sendJson(response, 200, { data: posts });
    } catch (error) {
      console.error("Error listing posts:", error);
      return sendJson(response, 500, { message: "Could not list posts" });
    }
  });

  router.get("/posts/:id", async (request, response) => {
    try {
      const posts = await findPostById(request.params.id);

      if (!posts) {
        return sendJson(response, 404, { message: "Post not found" });
      }

      return sendJson(response, 200, { data: posts });
    } catch (error) {
      console.error("Error listing posts:", error);
      return sendJson(response, 500, { message: "Could not list posts" });
    }
  });

  for (const path of ["/posts/draft", "/posts/drafts"]) {
    router.post(path, async (request, response) => {
      let body;

      try {
        body = await parseJsonBody(request);
      } catch (error) {
        console.error("Error parsing request body:", error);
        return sendJson(response, 400, { message: "Invalid JSON" });
      }

      const { idea } = body;
      if (!idea) {
        return sendJson(response, 400, { message: "Idea is required" });
      }

      try {
        const post = await createDraftAndSave(idea);
        return sendJson(response, 201, { data: post });
      } catch (error) {
        console.error("Error generating post draft:", error);
        return sendJson(response, 500, { message: "Could not generate post" });
      }
    });
  }
}
