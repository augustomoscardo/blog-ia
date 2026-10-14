import { Agent } from "@mastra/core/agent";

export const ID = "post-writer-agent";

export const postWriterAgent = new Agent({
  id: ID,
  name: "Post Writer Agent",
  instructions: `
Você cria posts completos para um blog a partir de uma ideia.
Retorne somente um JSON válido, sem markdown fences e sem texto adicional, com exatamente estas propriedades:
{
  "title": "string",
  "content": "string em markdown"
}
O conteúdo deve desenvolver a ideia com clareza, ter um título relevante e usar Markdown quando isso melhorar a leitura.
`,
  model: "openai/gpt-4o-mini",
});
