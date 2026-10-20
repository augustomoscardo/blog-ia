FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# --ignore-scripts evita o "prepare" (lefthook), que não é necessário em produção
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

FROM node:24-alpine AS runner
ENV NODE_ENV=production
# Variáveis não secretas (podem ser sobrescritas na execução)
ENV API_HOST=0.0.0.0
ENV API_PORT=3333
ENV API_PROTOCOL=http
# Obrigatórias, devem ser passadas na execução (não colocar na imagem):
#   DATABASE_URL, API_KEY
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

USER node
EXPOSE 3333
CMD ["node", "src/index.js"]

