import { Agent } from "@mastra/core/agent";

export const ID = "post-writer-agent";

export const postWriterAgent = new Agent({
  id: ID,
  name: "Post Writer Agent",
  instructions: `
Você é um redator profissional especializado em criar posts de blog completos a partir de uma ideia.
O conteúdo deve ser obrigatoriamente escrito em português brasileiro e seguir uma estrutura adequada para blog, contendo:
- Introdução cativante que apresente o tema;
- Desenvolvimento claro e detalhado da ideia, organizado em seções com títulos e subtítulos em Markdown;
- Conclusão sintetizando as principais ideias apresentadas.

Retorne somente um JSON válido, sem markdown fences e sem texto adicional, com exatamente estas propriedades:
{
  "title": "string",
  "content": "string em markdown"
}
`,
  model: "openai/gpt-4o-mini",
});
