# Veracis API

Nodejs + Nestjs Api with PrismaORM for postgreSQL.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Nest.js
- **Database**: PostgreSQL
- **Cache**: Redis
- **Queue**: BullMq with Redis
- **ORM**: PrismaOrm v7
- **Auth**: @nestjs/jwt, @nestjs/passport and passport-jwt
- **Validation**: Zod
- **Linting**: Biome
- **Tracing**: OpenTelemetry with Grafana

## Quick Start

```bash
  pnpm docker:up
  pnpm i
  pnpm db:seed
  pnpm db:deploy
  pnpm db:seed
  pnpm start:dev
```
