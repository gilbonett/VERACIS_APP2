---
title: Queries por Fluxo - Banco de Dados
tags:
  - database
  - performance
  - inventario
aliases:
  - Queries por Fluxo
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Queries por Fluxo

| | |
|---|---|
| **Domínio** | [[Banco-de-Dados\|Banco de Dados]] |
| **Código-fonte** | `apps/api/src/infra/database/prisma/*/repositories/` |
| **Última atualização** | 2026-07-24 |

---

## 1. Alertas (`alerts`)

| Método | Arquivo | Forma | Filtros (`where`) | Include/Select | Ordenação | Paginação |
|---|---|---|---|---|---|---|
| `AlertDetailsRepository.findMany` | `alerts/repositories/prisma-alert-details-repository.ts:27` | `findMany` | `status IN (...)`, `communityId?` | `include` completo (ver [[Duplicidades-e-Oportunidades-de-Batch-Join]]) | **nenhuma** (sem `orderBy`) | **nenhuma** |
| `AlertDetailsRepository.findById` | `prisma-alert-details-repository.ts:14` | `findUnique` | `id` | mesmo `include` completo | — | — |
| `AlertMetricsRepository.findByCommunityId` | `alerts/repositories/prisma-alert-metrics-repository.ts:10` | `groupBy` + 2× `findMany` com `_count` correlacionado | `communityId` (3 queries em paralelo) | `select` mínimo | — | — |
| `AlertRepository.findAll` | `prisma-alert-repository.ts:64` | `findMany` | nenhum | `include: {events, attachments}` | — | **nenhuma** |
| `AlertCommentRepository.findAll` | `prisma-alert-comment-repository.ts:29` | `findMany` | nenhum | sem `select` | — | **nenhuma** |
| `AlertReactionRepository.findByAlertIdAndAuthorId` | `prisma-alert-reaction-repository.ts:26` | `findFirst` | `alertId` + `authorId` | — | — | — |
| `AlertReactionRepository.findCountByAlertIdAndLiked` | `prisma-alert-reaction-repository.ts:17` | `count` | `alertId`, `type=LIKE` | — | — | — |

## 2. Usuários (`users`, `memberships`)

| Método | Arquivo | Forma | Filtros | Include/Select | Ordenação | Paginação |
|---|---|---|---|---|---|---|
| `UserRepository.findByEmail` | `users/repositories/prisma-user-repository.ts:64` | `findUnique` | `email` (único) | `memberships → community → biome` (3 níveis) | — | — |
| `UserRepository.findByCpf` | `prisma-user-repository.ts:87` | `findUnique` | `cpf` (único) | mesmo include de 3 níveis | — | — |
| `UserRepository.findByPhone` | `prisma-user-repository.ts:41` | `findFirst` | `phone` | mesmo include de 3 níveis | — | — |
| `UserRepository.findById` | `prisma-user-repository.ts:122` | `findUnique` **com cache Redis** | `id` | mesmo include de 3 níveis | — | — |
| `UserRepository.findAll` | `prisma-user-repository.ts:153` | `findMany` | nenhum | mesmo include de 3 níveis | — | **nenhuma** |
| `MembershipRepository.findManyByCommunityId` | `users/repositories/prisma-membership-repository.ts:29` | `findMany` | `communityId` | — | — | — |
| `MembershipRepository.findManyByCommunityIdsAndLeader` | `prisma-membership-repository.ts:12` | `findMany` | `communityId IN (...)` + `user.role = LEADER` (join) | — | — | — |

> [!warning] `findByPhone` não está declarado no contrato abstrato `UserRepository` (`apps/api/src/domain/users/repositories/user-repository.ts`) e nenhum caso de uso o chama (`grep` por `findByPhone` só encontra a própria implementação). É código morto hoje — ver [[Indices-Redundantes-ou-Nao-Utilizados]].

## 3. Notificações (`notifications`)

| Método | Arquivo | Forma | Filtros | Paginação |
|---|---|---|---|---|
| `findCountByRecipientId` | `notifications/repositories/prisma-notification-repository.ts:19` | `count` | `recipientId`, `readAt IS NULL`, `OR(alertId IS NULL, alert.status NOT IN (CLOSED,REJECTED))` | — |
| `findManyByRecipientId` | `prisma-notification-repository.ts:32` | `findMany` | mesmos filtros do count | **cursor-based, correto** (`take: limit+1`, `skip: cursor?1:0`) |

> [!tip] Este é o único fluxo de listagem do projeto com paginação por cursor implementada corretamente — usar como referência ao corrigir os demais em [[Problemas-de-Paginacao]].

## 4. Comunidades e Referências (`communities`, `events`, `categories`, `biomes`, `risks`)

| Método | Arquivo | Filtros | Paginação |
|---|---|---|---|
| `CommunityRepository.findManyWithQueries` | `communities/repositories/prisma-community-repository.ts:14` | `biomeId?` | **nenhuma** (`orderBy: name asc`) |
| `CommunityRepository.findAll` | `prisma-community-repository.ts:52` | nenhum | **nenhuma** |
| `EventRepository.findManyByCategoryId` | `communities/repositories/prisma-event-repository.ts:11` | `categoryId` | **nenhuma** |
| `CategoryRepository.findAll` | `categories/repositories/prisma-category-repository.ts:26` | nenhum | **nenhuma** |
| `BiomeRepository.findAll` | `categories/repositories/prisma-biome-repository.ts:29` | nenhum | **nenhuma** |
| `RiskRepository.findMany` | `risks/repositories/prisma-risk-repository.ts:11` | nenhum | **nenhuma** |

## 5. Auth (`sessions`, `password_resets`, `otp_challenges`)

Todos CRUD simples por `id`/`userId`, sem padrões problemáticos relevantes — ver avaliação positiva em [[Indices-Existentes-por-Tabela]] (seção 3).

## 6. Jobs BullMQ (fora do ciclo HTTP)

| Fila | Processor | Query | Observação |
|---|---|---|---|
| `ALERT_PENDING_EXPIRATION` | `alert-pending-processor.ts` | busca 1 `Alert` por `id`, atualiza status | 1 job por alerta criado, não é query em lote |
| `ALERT_ACCEPTED_EXPIRATION` | `alert-accepted-processor.ts` | idem | idem |
| `MAIL` | `mail-processor.ts` | sem query a banco (só e-mail) | irrelevante para este documento |

Nenhuma dessas filas executa query custosa — cada job atua sobre um único `alertId` via PK.

## Ver também

- [[Banco-de-Dados]] — índice
- [[Queries-Mais-Utilizadas]]
- [[Queries-Lentas-Documentadas]]
