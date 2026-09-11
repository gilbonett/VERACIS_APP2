---
title: Índices Existentes por Tabela - Banco de Dados
tags:
  - database
  - performance
  - indices
aliases:
  - Índices Existentes
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Índices Existentes por Tabela

| | |
|---|---|
| **Domínio** | [[Banco-de-Dados\|Banco de Dados]] |
| **Código-fonte** | `apps/api/prisma/models/*.prisma`, `apps/api/prisma/migrations/*/migration.sql` |
| **Última atualização** | 2026-07-24 |

---

Levantado cruzando o schema Prisma com o SQL efetivamente gerado nas migrations — **fonte de verdade é a migration**, não o `@@index` isolado (schema e SQL gerado coincidem em todos os casos abaixo, confirmado).

## 1. `alerts` — 🔴 apenas a PK

| Coluna | Índice? |
|---|---|
| `id` | PK (`alerts_pkey`) |
| `status`, `author_id`, `community_id`, `category_id`, `created_at` | **nenhum** |

Confirmado em `prisma/migrations/20260409151602_init/migration.sql:23-35` — a definição de `CREATE TABLE "alerts"` só tem `CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")`, sem nenhum `CREATE INDEX` subsequente para essa tabela em nenhuma das 6 migrations. Ver [[Indices-Recomendados]].

## 2. Tabelas de associação de `Alert`

| Tabela | Índices | Observação |
|---|---|---|
| `alert_comments` | `@@index([author_id, alert_id])` | ✅ cobre buscas por `alert_id` (2ª coluna) só quando combinada a `author_id` — hoje não há query que filtre só por `alert_id`, então está adequado ao uso atual |
| `alert_reactions` | `@@unique([author_id, alert_id])` + `@@index([author_id, alert_id])` (redundante, ver [[Indices-Redundantes-ou-Nao-Utilizados]]) | `findByAlertIdAndAuthorId` e `findCountByAlertIdAndLiked` cobertos |
| `alert_events` | PK composta `(event_id, alert_id)` | sem índice adicional; uso atual é só via `include` a partir de `alert_id` já conhecido, então baixa prioridade |
| `alert_risks` | PK composta `(risk_id, alert_id)` | mesma situação de `alert_events` |

## 3. Domínio de Usuários e Auth

| Tabela | Índices | Avaliação |
|---|---|---|
| `users` | `UNIQUE(cpf)`, `UNIQUE(email)`, `@@index([email, cpf, phone])` | ⚠️ o índice composto é redundante para `email`/`cpf` isolados (já cobertos pelos únicos) — ver [[Indices-Redundantes-ou-Nao-Utilizados]] |
| `sessions` | `@@index([userId])`, `@@index([expiresAt])` | ✅ boa prática — dois índices simples, ambos usados (`findById`, limpeza por expiração) |
| `password_resets` | `@@index([userId, expiresAt])` | ✅ **exemplo de bom índice composto** — cobre exatamente o padrão de consulta "resets pendentes de um usuário, dentro da validade" |
| `otp_challenges` | `@@index([userId])` | ✅ adequado ao uso atual (`expirePendingByUserId`) |
| `user_terms` | nenhum | Aceitável — tabela é write-only hoje, sem query de leitura encontrada |

## 4. Domínio de Comunidades e Referência

| Tabela | Índices | Avaliação |
|---|---|---|
| `communities` | `UNIQUE(slug)` + `@@index([slug])` (redundante) | `biome_id`, `author_id` sem índice — ver [[Indices-Recomendados]] |
| `biomes` | `UNIQUE(slug)` + `@@index([slug])` (redundante) | tabela pequena, baixo risco, mas o índice redundante ainda custa em escrita |
| `events` | `UNIQUE(slug)` + `@@index([slug])` (redundante) | `category_id` sem índice — usado em `findManyByCategoryId` |
| `risks` | `UNIQUE(slug)` + `@@index([slug])` (redundante) | — |
| `categories` | nenhum | Adequado — hoje só `findAll`/`findById`, sem filtro por coluna extra |
| `memberships` | PK composta `(user_id, community_id)` | ausência de índice em `community_id` isolado — ver [[Indices-Recomendados]] |

## 5. Notificações e Anexos

| Tabela | Índices | Avaliação |
|---|---|---|
| `notifications` | `@@index([scope])`, `@@index([recipientId])` | ✅ `recipient_id` (coluna mais consultada) está indexada; `author_id`/`alert_id` sem índice mas sem uso confirmado que dependa deles diretamente |
| `attachments` | `@@index([scope])`, `@@index([alertId])` | ✅ já bem indexado para o padrão de uso atual |

## Ver também

- [[Banco-de-Dados]] — índice
- [[Indices-Recomendados]]
- [[Indices-Redundantes-ou-Nao-Utilizados]]
