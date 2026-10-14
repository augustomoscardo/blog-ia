import { nanoid } from "nanoid";
import { z } from "zod";
import { mastra } from "../mastra/index.js";
import { ID } from "../mastra/agents/post-writer-agent.js";
import * as postRepository from "../repositories/post-repository.js";

const postContentSchema = z.object({
  title: z.string().describe("Título do post"),
  content: z.string().describe("Conteúdo completo do post em Markdown"),
});

export async function createPostDraft(idea) {
  const agent = mastra.getAgentById(ID);

  const response = await agent.generate(
    `Crie um post de blog completo baseado na seguinte ideia:\n\n${idea}`,
    {
      structuredOutput: {
        schema: postContentSchema,
      },
    },
  );

  const { title, content } = response.object;

  return {
    id: nanoid(),
    title,
    content,
    published_at: null,
    created_at: new Date().toISOString(),
    approved_at: null,
    rejected_at: null,
  };
}

export async function listPosts() {
  return postRepository.findAllPosts();
}

export async function savePost(post) {
  return postRepository.createPost(post);
}

export async function createDraftAndSave(idea) {
  const draft = await createPostDraft(idea);
  return postRepository.createPost(draft);
}
