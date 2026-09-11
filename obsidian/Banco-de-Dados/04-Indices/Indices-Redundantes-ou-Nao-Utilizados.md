---
title: Índices Redundantes ou Não Utilizados - Banco de Dados
tags:
  - database
  - performance
  - indices
  - refactor
aliases:
  - Índices Redundantes
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Índices Redundantes ou Não Utilizados

| | |
|---|---|
| **Domínio** | [[Banco-de-Dados\|Banco de Dados]] |
| **Última atualização** | 2026-07-24 |

---

## 1. Índices duplicados em colunas `slug` — 🟠 Confirmado

Quatro tabelas de dado de referência têm **dois índices na mesma coluna única**: um `UNIQUE INDEX` (gerado por `@unique` no Prisma) e um `INDEX` comum adicional (gerado por `@@index([slug])`, redundante). Confirmado lendo o SQL gerado:

```sql
-- prisma/migrations/20260409151602_init/migration.sql
CREATE UNIQUE INDEX "biomes_slug_key" ON "biomes"("slug");
CREATE INDEX "biomes_slug_idx" ON "biomes"("slug");             -- redundante

CREATE UNIQUE INDEX "communities_slug_key" ON "communities"("slug");
CREATE INDEX "communities_slug_idx" ON "communities"("slug");   -- redundante

CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");
CREATE INDEX "events_slug_idx" ON "events"("slug");             -- redundante

-- prisma/migrations/20260410134456_add_model_risk/migration.sql
CREATE UNIQUE INDEX "risks_slug_key" ON "risks"("slug");
CREATE INDEX "risks_slug_idx" ON "risks"("slug");                -- redundante
```

Um índice único do Postgres serve tanto para garantir unicidade quanto para acelerar busca por igualdade/ordenação — exatamente o que o índice comum adicional faria. O índice comum não traz nenhum ganho de leitura e ainda paga o custo de manutenção em todo `INSERT`/`UPDATE` dessas tabelas.

**Correção**: remover o `@@index([slug])` das 4 entidades (`Biome`, `Community`, `Event`, `Risk`) em `prisma/models/*.prisma`, mantendo apenas `@unique` no campo. Gerar migration com `DROP INDEX`:

```sql
DROP INDEX "biomes_slug_idx";
DROP INDEX "communities_slug_idx";
DROP INDEX "events_slug_idx";
DROP INDEX "risks_slug_idx";
```

Impacto: baixo (tabelas pequenas, dado de referência), mas o esforço também é mínimo — quick win.

## 2. `users_email_cpf_phone_idx` — 🟠 Confirmado + Hipótese de uso

```sql
CREATE INDEX "users_email_cpf_phone_idx" ON "users"("email", "cpf", "phone");
```

`email` e `cpf` já têm índice único próprio (`users_email_key`, `users_cpf_key`). Um índice composto só é útil para consultas que filtram pela **coluna mais à esquerda** — ou seja, este índice só ajudaria consultas que já usam `email` (redundante com `users_email_key`) e, no máximo, adicionaria valor a uma consulta que filtrasse `email` **e** `cpf` **e** `phone` juntos. Nenhuma consulta desse tipo foi encontrada no código.

Pior: uma busca **apenas por `phone`** (`findByPhone`) **não pode usar este índice**, porque `phone` não é a coluna mais à esquerda — ela faria Seq Scan mesmo com o índice composto presente. E essa busca por telefone é, hoje, código morto (ver seção 3).

**Correção recomendada**: remover o índice composto por completo.

```sql
DROP INDEX "users_email_cpf_phone_idx";
```

Se no futuro o login por telefone for de fato implementado, criar um índice dedicado nesse momento: `CREATE INDEX users_phone_idx ON users (phone);` — separado, não composto, já que hoje não há evidência de consulta combinando as três colunas.

## 3. `findByPhone` — código morto — 🟡 Confirmado

`PrismaUserRepository.findByPhone` (`apps/api/src/infra/database/prisma/users/repositories/prisma-user-repository.ts:41`) existe, mas:

- **Não está declarado** no contrato abstrato `UserRepository` (`apps/api/src/domain/users/repositories/user-repository.ts` só declara `findByCpf` e `findByEmail`).
- **Nenhum caso de uso o chama** — `SignInUseCase` usa exclusivamente `findByCpf` (`apps/api/src/domain/auth/use-cases/sign-in.use-case.ts:52`).

Não é um problema de performance por si só (método não usado não gera carga), mas é uma consulta com `findFirst` sobre coluna não indexada e `include` de 3 níveis mantida viva sem propósito — se reativado sem revisão, herda o mesmo padrão caro do `findByEmail`/`findByCpf` (ver [[Duplicidades-e-Oportunidades-de-Batch-Join]]).

**Correção**: remover o método, ou formalizar no contrato + adicionar índice em `phone` se o login por telefone for uma funcionalidade planejada.

## 4. Resumo

| Item | Tipo | Ação | Impacto | Esforço |
|---|---|---|---|---|
| `biomes_slug_idx`, `communities_slug_idx`, `events_slug_idx`, `risks_slug_idx` | Duplicado | `DROP INDEX` (4x) | Baixo | Baixo |
| `users_email_cpf_phone_idx` | Redundante + mal ordenado | `DROP INDEX` | Baixo-Médio | Baixo |
| `findByPhone` | Código morto | Remover ou formalizar | Baixo (manutenção) | Baixo |

## Ver também

- [[Banco-de-Dados]] — índice
- [[Indices-Existentes-por-Tabela]]
- [[Indices-Recomendados]]
