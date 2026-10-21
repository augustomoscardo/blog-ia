import {
  createDraftAndSave,
  listPosts,
  findPublicPostById,
  approvePost,
  rejectPost,
} from "../services/post-service.js";
import { parseJsonBody, sendJson } from "../utils/http.js";

export function registerPostRoutes(router) {
  router.get("/posts", async (request, response) => {
    const { searchParams } = new URL(request.url || "/", "http://localhost");
    const includeAll = searchParams.get("include") === "all";

    try {
      const posts = await listPosts({ includeAll });
      return sendJson(response, 200, { data: posts });
    } catch (error) {
      console.error("Error listing posts:", error);
      return sendJson(response, 500, { message: "Could not list posts" });
    }
  });

  router.get("/posts/:id", async (request, response) => {
    try {
      const post = await findPublicPostById(request.params.id);

      if (!post) {
        return sendJson(response, 404, { message: "Post not found" });
      }

      return sendJson(response, 200, { data: post });
    } catch (error) {
      console.error("Error finding post:", error);
      return sendJson(response, 500, { message: "Could not find post" });
    }
  });

  router.patch("/posts/:id/approve", async (request, response) => {
    try {
      const post = await approvePost(request.params.id);

      if (!post) {
        return sendJson(response, 404, { message: "Post not found" });
      }

      return sendJson(response, 200, { data: post });
    } catch (error) {
      console.error("Error approving post:", error);
      return sendJson(response, 500, { message: "Could not approve post" });
    }
  });

  router.delete("/posts/:id/reject", async (request, response) => {
    try {
      const post = await rejectPost(request.params.id);

      if (!post) {
        return sendJson(response, 404, { message: "Post not found" });
      }

      return sendJson(response, 200, { data: post });
    } catch (error) {
      console.error("Error rejecting post:", error);
      return sendJson(response, 500, { message: "Could not reject post" });
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
