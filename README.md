# Blog IA

API HTTP em Node.js que gera rascunhos de posts de blog com IA (agente [Mastra](https://mastra.ai) + `openai/gpt-4o-mini`), armazena os posts no PostgreSQL e expõe um fluxo de aprovação/rejeição.

## Stack

- Node.js (ESM, `node:http` puro, sem framework) — versão definida em `.nvmrc` (`lts/krypton`); a imagem Docker usa Node 24
- PostgreSQL 17
- [Mastra](https://mastra.ai) (`@mastra/core`) para o agente de escrita
- [Postgrator](https://github.com/rickbergfalk/postgrator) para migrations
- `zod`, `nanoid`, `pg`
- Qualidade: `oxlint`, `oxfmt`, `commitlint` (Conventional Commits), `lefthook`, `lint-staged`
- Containers: Podman (compatível com Docker)

## Estrutura

```
src/
├── index.js                      # servidor HTTP, shutdown gracioso e migrations no boot
├── routes/posts.js               # rotas de /posts
├── services/post-service.js      # regras de negócio e geração via IA
├── repositories/post-repository.js
├── mastra/                       # configuração Mastra e agente post-writer
├── database/
│   ├── init.js                   # executa as migrations
│   ├── pool.js
│   └── migrations/               # 001.do / 001.undo (tabela posts)
└── utils/                        # router, http, auth
```

## Variáveis de ambiente

Veja `.env.example`.

| Variável         | Descrição                                                                                                   | Padrão                                   |
| ---------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `API_PORT`       | Porta do servidor                                                                                           | `3000` (`3333` na imagem Docker)         |
| `API_HOST`       | Host de bind                                                                                                | `localhost` (`0.0.0.0` na imagem Docker) |
| `API_PROTOCOL`   | Apenas usado no log de inicialização                                                                        | `http`                                   |
| `DATABASE_URL`   | Connection string do PostgreSQL (**obrigatória**)                                                           | —                                        |
| `API_KEY`        | Chave Bearer para autenticação opcional                                                                     | —                                        |
| `OPENAI_API_KEY` | Chave da OpenAI usada pelo Mastra para o modelo `openai/gpt-4o-mini` (**obrigatória para gerar rascunhos**) | —                                        |

## Setup local

Pré-requisitos: Node.js (via `nvm use`), Podman (ou Docker) e `podman compose`.

```bash
npm install

# Cria .env.local, sobe o PostgreSQL e roda as migrations
npm run local:setup
```

Edite `.env.local` e preencha ao menos:

```env
API_PORT=3333
API_HOST="localhost"
API_PROTOCOL="http"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/blog"
API_KEY="uma-chave-secreta"
OPENAI_API_KEY="sk-..."
```

Inicie em modo desenvolvimento (com `--watch`):

```bash
npm run dev
```

A API sobe em `http://localhost:3333` (ou conforme `API_PORT`). Ao iniciar, as migrations pendentes são aplicadas automaticamente.

### Scripts

| Script                            | Descrição                                        |
| --------------------------------- | ------------------------------------------------ |
| `npm run dev`                     | Servidor com hot reload usando `.env.local`      |
| `npm run env:setup`               | Copia `.env.example` para `.env.local`           |
| `npm run local:setup`             | `env:setup` + `infra:up` + `migrate:up`          |
| `npm run infra:up` / `infra:down` | Sobe/derruba o PostgreSQL (`docker-compose.yml`) |
| `npm run migrate:up`              | Aplica todas as migrations                       |
| `npm run migrate:down`            | Reverte todas as migrations (`migrate 0`)        |
| `npm run lint`                    | Lint com oxlint                                  |
| `npm test`                        | Todos os testes (unit + integração + e2e)        |
| `npm run test:unit`               | Apenas testes unitários (sem banco)              |
| `npm run test:integration`        | Testes de integração (repositório + PostgreSQL)  |
| `npm run test:e2e`                | Testes e2e HTTP com supertest                    |
| `npm run test:watch`              | Testes unitários em modo watch                   |
| `npm run test:coverage`           | Todos os testes com relatório de cobertura       |
| `npm run format` / `format:check` | Formata / verifica formatação com oxfmt          |
| `npm run commitlint`              | Valida a mensagem do último commit               |
| `npm run docker:build`            | Build da imagem `blog-ia:latest`                 |
| `npm run docker:run`              | Executa a imagem na rede `blog-network`          |

## Endpoints

Todas as respostas são JSON. Sucesso: `{ "data": ... }`; erro: `{ "message": "..." }`.

| Método   | Rota                                   | Auth | Descrição                                                       |
| -------- | -------------------------------------- | ---- | --------------------------------------------------------------- |
| `GET`    | `/`                                    | —    | Health check simples (`{"message":"Hello World"}`)              |
| `GET`    | `/posts`                               | —    | Lista posts públicos (publicados, aprovados e não rejeitados)   |
| `GET`    | `/posts?include=all`                   | —    | Lista todos os posts, incluindo rascunhos e rejeitados          |
| `GET`    | `/posts/:id`                           | —    | Busca um post público por id (404 para rascunhos ou rejeitados) |
| `POST`   | `/posts/draft` (alias `/posts/drafts`) | —    | Gera um rascunho com IA a partir de uma ideia                   |
| `PATCH`  | `/posts/:id/approve`                   | —    | Aprova um post                                                  |
| `DELETE` | `/posts/:id/reject`                    | —    | Rejeita um post                                                 |
| `GET`    | `/api/docs`                            | —    | Documentação Swagger UI da API                                  |
| `GET`    | `/api/docs/json`                       | —    | Especificação OpenAPI 3 em JSON                                 |

### Códigos de status

- `200` sucesso · `201` rascunho criado
- `400` JSON inválido ou `idea` ausente
- `404` post não encontrado ou não público / rota não encontrada
- `500` erro interno / falha na geração

### Exemplos

```bash
# Gerar rascunho
curl -X POST http://localhost:3333/posts/draft \
  -H "Content-Type: application/json" \
  -d '{"idea": "Como começar com Node.js"}'

# Listar posts públicos
curl http://localhost:3333/posts

# Listar todos os posts
curl "http://localhost:3333/posts?include=all"

# Buscar, aprovar e rejeitar
curl http://localhost:3333/posts/<id>
curl -X PATCH  http://localhost:3333/posts/<id>/approve
curl -X DELETE http://localhost:3333/posts/<id>/reject
```

Exemplo de post retornado:

```json
{
  "data": {
    "id": "V1StGXR8_Z5jdHi6B-myT",
    "title": "Como começar com Node.js",
    "content": "# ...",
    "published_at": null,
    "created_at": "2026-01-01T12:00:00.000Z",
    "approved_at": null,
    "rejected_at": null
  }
}
```

> [!WARNING]
> Os endpoints `POST /posts/draft`, `PATCH .../approve` e `DELETE .../reject` **não** exigem autenticação no código atual. Em produção, proteja-os (ex.: com `hasValidApiKey` ou um proxy/gateway), pois `draft` consome créditos da OpenAI.

## Testes

Usam o test runner nativo do Node.js (`node --test`) e [supertest](https://github.com/ladjs/supertest) nos testes e2e. Ficam em `test/`:

| Tipo       | Pasta              | O que cobre                                                                                   |
| ---------- | ------------------ | --------------------------------------------------------------------------------------------- |
| Unitário   | `test/unit`        | router, helpers HTTP, auth e `post-service` (repositório e Mastra mockados com `mock.module`) |
| Integração | `test/integration` | `post-repository` e migrations contra um PostgreSQL real                                      |
| E2E        | `test/e2e`         | todas as rotas via supertest, com banco real e a chamada à OpenAI mockada                     |

Os testes de integração e e2e precisam do PostgreSQL no ar (`npm run infra:up`). Eles usam um banco separado (`blog_test`), criado e migrado automaticamente, para não tocar nos dados de desenvolvimento. Para usar outro banco, defina `DATABASE_URL_TEST`. Nenhum teste chama a OpenAI, então `OPENAI_API_KEY` não é necessária.

```bash
npm run infra:up
npm test
```

> [!NOTE]
> Os testes usam `--experimental-test-module-mocks` (Node 22.3+) e rodam com `--test-concurrency=1`, pois compartilham o mesmo banco.

## Banco de dados

Tabela `posts`: `id`, `title`, `content`, `published_at`, `created_at`, `approved_at`, `rejected_at`.

Migrations ficam em `src/database/migrations` (padrão Postgrator `NNN.do.*.sql` / `NNN.undo.*.sql`). Para criar uma nova, adicione o par `002.do.*.sql` e `002.undo.*.sql`.

## Build

A imagem usa multi-stage build (`Dockerfile`): instala só dependências de produção (`npm ci --omit=dev --ignore-scripts`) e roda como usuário `node`, expondo a porta `3333`.

```bash
npm run docker:build
# equivalente a: podman build -t blog-ia:latest .
# (com Docker: docker build -t blog-ia:latest .)
```

Para testar a imagem localmente (PostgreSQL precisa estar no ar via `npm run infra:up`):

```bash
podman run --rm --name blog-api --network blog-network -p 3333:3333 \
  -e DATABASE_URL=postgresql://postgres:postgres@blog-postgres:5432/blog \
  -e API_KEY=minha-chave \
  -e OPENAI_API_KEY=sk-... \
  blog-ia:latest
```

> [!NOTE]
> O script `docker:run` do `package.json` não repassa `OPENAI_API_KEY`; passe-a manualmente como acima.

## Publicação em produção

Não há pipeline de deploy no repositório; o fluxo recomendado é:

1. **Banco**: provisione um PostgreSQL gerenciado (ou próprio) e obtenha a `DATABASE_URL` (use `?sslmode=require` se o provedor exigir).
2. **Build e push da imagem** para um registry:
   ```bash
   docker build -t <registry>/blog-ia:<versao> .
   docker push <registry>/blog-ia:<versao>
   ```
3. **Configure as variáveis** no ambiente de execução (como secrets, nunca na imagem): `DATABASE_URL`, `API_KEY`, `OPENAI_API_KEY`. Opcionais: `API_PORT` (padrão `3333`), `API_HOST` (padrão `0.0.0.0`).
4. **Execute o container** expondo a porta `3333` (Fly.io, Railway, Render, ECS, Cloud Run, Kubernetes, VPS com Docker etc.):
   ```bash
   docker run -d --name blog-api --restart unless-stopped -p 3333:3333 \
     -e DATABASE_URL=... -e API_KEY=... -e OPENAI_API_KEY=... \
     <registry>/blog-ia:<versao>
   ```
5. **Migrations**: são aplicadas automaticamente na inicialização da aplicação (`initializeDatabase`). Se falharem, o processo encerra com código 1.
6. **Verifique**: `curl https://<seu-dominio>/` deve retornar `{"message":"Hello World"}` (use como health check).
7. **HTTPS**: coloque a API atrás de um proxy reverso/load balancer com TLS.

O servidor trata `SIGINT`/`SIGTERM` com shutdown gracioso (fecha o servidor HTTP e o pool do banco), compatível com rolling deploys.

## Qualidade de código

- Hooks do Git via `lefthook` (instalados no `npm install` pelo script `prepare`).
- `lint-staged` roda `oxlint --fix` e `oxfmt --write` nos arquivos `.js/.mjs/.cjs` em staging.
- Commits seguem [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:` …).

## Licença

ISC
