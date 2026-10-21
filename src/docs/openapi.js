const errorResponse = (description) => ({
  description,
  content: {
    "application/json": { schema: { $ref: "#/components/schemas/Error" } },
  },
});

const postResponse = (description) => ({
  description,
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: { data: { $ref: "#/components/schemas/Post" } },
      },
    },
  },
});

const idParameter = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string" },
  description: "Post ID",
};

const createDraftOperation = {
  tags: ["Posts"],
  summary: "Generate and save a post draft from an idea",
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["idea"],
          properties: { idea: { type: "string", example: "Benefits of unit testing" } },
        },
      },
    },
  },
  responses: {
    201: postResponse("Draft created"),
    400: errorResponse("Invalid JSON or missing idea"),
    500: errorResponse("Could not generate post"),
  },
};

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Blog IA API",
    version: "1.0.0",
    description: "API for generating, reviewing and publishing blog posts with AI.",
  },
  tags: [{ name: "Posts" }, { name: "Health" }],
  paths: {
    "/": {
      get: {
        tags: ["Health"],
        summary: "Hello World",
        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { message: { type: "string", example: "Hello World" } },
                },
              },
            },
          },
        },
      },
    },
    "/posts": {
      get: {
        tags: ["Posts"],
        summary: "List posts",
        description:
          "By default returns only published, non-rejected posts. `include=all` returns every post, including drafts and rejected posts.",
        parameters: [
          {
            name: "include",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["all"] },
            description: "Use `all` to include unpublished/rejected posts",
          },
        ],
        responses: {
          200: {
            description: "List of posts",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/Post" } },
                  },
                },
              },
            },
          },
          500: errorResponse("Could not list posts"),
        },
      },
    },
    "/posts/{id}": {
      get: {
        tags: ["Posts"],
        summary: "Get a post by ID",
        parameters: [idParameter],
        responses: {
          200: postResponse("The post"),
          404: errorResponse("Post not found"),
          500: errorResponse("Could not list posts"),
        },
      },
    },
    "/posts/{id}/approve": {
      patch: {
        tags: ["Posts"],
        summary: "Approve and publish a post",
        parameters: [idParameter],
        responses: {
          200: postResponse("Post approved"),
          404: errorResponse("Post not found"),
          500: errorResponse("Could not approve post"),
        },
      },
    },
    "/posts/{id}/reject": {
      delete: {
        tags: ["Posts"],
        summary: "Reject a post",
        parameters: [idParameter],
        responses: {
          200: postResponse("Post rejected"),
          404: errorResponse("Post not found"),
          500: errorResponse("Could not reject post"),
        },
      },
    },
    "/posts/draft": { post: createDraftOperation },
    "/posts/drafts": {
      post: { ...createDraftOperation, summary: "Alias of /posts/draft" },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", description: "API_KEY value" },
    },
    schemas: {
      Post: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          content: { type: "string" },
          published_at: { type: "string", format: "date-time", nullable: true },
          created_at: { type: "string", format: "date-time" },
          approved_at: { type: "string", format: "date-time", nullable: true },
          rejected_at: { type: "string", format: "date-time", nullable: true },
        },
      },
      Error: {
        type: "object",
        properties: { message: { type: "string" } },
      },
    },
  },
};
