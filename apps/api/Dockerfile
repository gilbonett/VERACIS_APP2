FROM node:24-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

FROM base AS pruner
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN pnpm config set store-dir /root/.local/share/pnpm/store
RUN pnpm add -g turbo@2.5.8
# RUN pnpm add -g prisma
COPY . .
RUN turbo prune @veracis/api --docker

FROM base AS builder
WORKDIR /app

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY --from=pruner /app/out/full/ .
COPY turbo.json turbo.json

WORKDIR /app/apps/api
ENV DATABASE_URL=postgresql://placeholder
RUN pnpm db:generate
RUN mkdir -p ./certs && \
    curl -sS "https://truststore.pki.rds.amazonaws.com/sa-east-1/sa-east-1-bundle.pem" \
    -o ./certs/sa-east-1-bundle.pem

WORKDIR /app
RUN pnpm turbo run build --filter=@veracis/api
RUN CI=true pnpm install --prod --frozen-lockfile --ignore-scripts

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=builder --chown=nestjs:nestjs /app/package.json ./package.json
COPY --from=builder --chown=nestjs:nestjs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nestjs /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder --chown=nestjs:nestjs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nestjs:nestjs /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder --chown=nestjs:nestjs /app/apps/api/prisma.config.ts ./apps/api/prisma.config.ts
COPY --from=builder --chown=nestjs:nestjs /app/apps/api/templates ./apps/api/templates
COPY --from=builder --chown=nestjs:nestjs /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder --chown=nestjs:nestjs /app/apps/api/certs ./apps/api/certs

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"

USER nestjs

EXPOSE 3333

CMD ["node", "apps/api/dist/src/main"]
