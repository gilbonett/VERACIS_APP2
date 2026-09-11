# Dockerfile para produção do app web Next.js em monorepo Turborepo
FROM node:20-alpine AS base

# Instalar dependências necessárias
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

# Stage 1: Pruning - Criar um subset do monorepo apenas com o necessário
FROM base AS pruner
WORKDIR /app

# Configurar pnpm e instalar turbo globalmente
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN pnpm config set store-dir /root/.local/share/pnpm/store
RUN pnpm add -g turbo@2.5.8

# Copiar todo o monorepo
COPY . .

# Fazer pruning para criar um subset apenas com @veracis/web e suas dependências
RUN turbo prune @veracis/web --docker

# Stage 2: Builder - Instalar dependências e fazer build
FROM base AS builder
WORKDIR /app

# Copiar arquivos de configuração de dependências
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Instalar dependências
RUN pnpm install --frozen-lockfile

# Copiar o código-fonte após instalar dependências (melhor cache)
COPY --from=pruner /app/out/full/ .

# Copiar turbo.json
COPY turbo.json turbo.json

# Build arguments para TODAS as variáveis de ambiente necessárias
# ARG NEXT_PUBLIC_API_URL
# ARG NEXT_PUBLIC_APP_URL
# ARG NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
# ARG JWT_PUBLIC_KEY

# # # Criar arquivo .env para o build (workers do Next.js precisam disso)
# RUN echo "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}" > apps/web/.env && \
#   echo "NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}" >> apps/web/.env && \
#   echo "NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=${NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}" >> apps/web/.env && \
#   echo "JWT_PUBLIC_KEY=${JWT_PUBLIC_KEY}" >> apps/web/.env && \
#   echo "NODE_ENV=${NODE_ENV}" >> apps/web/.env

# Setar TODAS as variáveis de ambiente para build
# Variáveis públicas (NEXT_PUBLIC_*)
# ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
# ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
# ENV NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=$NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
# ENV JWT_PUBLIC_KEY=$JWT_PUBLIC_KEY

# Habilitar standalone output
ENV NEXT_OUTPUT=standalone

# Fazer o build da aplicação
RUN pnpm turbo run build --filter=@veracis/web

# Remover .env após o build (segurança)
RUN rm -f apps/web/.env

# Stage 3: Runner - Imagem final otimizada
FROM base AS runner
WORKDIR /app

# Não rodar como root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar arquivos públicos
COPY --from=builder /app/apps/web/public ./apps/web/public

# Copiar arquivos standalone
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Runtime environment variables
# Estas serão fornecidas em runtime (docker run, docker-compose, kubernetes, etc)
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

USER nextjs

EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", "apps/web/server.js"]
