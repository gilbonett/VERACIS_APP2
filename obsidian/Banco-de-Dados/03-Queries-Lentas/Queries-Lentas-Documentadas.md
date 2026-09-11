---
title: Queries Lentas Documentadas - Banco de Dados
tags:
  - database
  - performance
  - queries-lentas
aliases:
  - Queries Lentas
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Queries Lentas Documentadas

| | |
|---|---|
| **Domínio** | [[Banco-de-Dados\|Banco de Dados]] |
| **Última atualização** | 2026-07-24 |

---

> [!warning] Sem `EXPLAIN ANALYZE` real. Os planos abaixo são inferidos: colunas de `WHERE`/`JOIN`/`ORDER BY` cruzadas com os índices confirmados em [[Indices-Existentes-por-Tabela]]. Ausência de índice em coluna filtrada ⇒ o planner do Postgres tende a escolher **Seq Scan** (ou, em joins, **Nested Loop** sem índice de apoio) quando a tabela cresce além de poucas centenas de linhas. Cada item indica se é **Confirmado** (código lido) ou **Hipótese** (depende de volume real).

## 1. `GET /alerts` — feed principal — 🔴 Crítico

**Confirmado.** `AlertDetailsRepository.findMany` (`apps/api/src/infra/database/prisma/alerts/repositories/prisma-alert-details-repository.ts:27`):

```ts
const results = await this.prisma.alert.findMany({
  where: PrismaAlertDetailsMapper.toWhere(query), // status IN (...), communityId?
  include: PrismaAlertDetailsMapper.include,       // ver abaixo
});
```

`PrismaAlertDetailsMapper.toWhere` (`.../mappers/prisma-alert-details-mapper.ts`) sempre aplica `status: { in: query.status }` e opcionalmente `communityId`. A tabela `alerts` não tem índice em `status` nem em `community_id` ([[Indices-Existentes-por-Tabela]]). Sem paginação (sem `take`/`skip`/`cursor`) — busca **todas** as linhas que casam o filtro de status, em **toda chamada ao feed**.

O `include` carrega, por alerta: `author` (todas as colunas de `User`, incluindo `password` hash — ver [[Outras-Oportunidades]]), `community` completa, `comments` com `author` aninhado (join a mais por comentário), `reactions`, `events → event → category` (3 níveis de join) e `attachments`. Cada linha de `alerts` retornada multiplica em várias linhas de join subjacentes.

> [!danger] Combinação: Seq Scan em `alerts` (sem índice de filtro) × sem paginação (sem limite de linhas) × include profundo (multiplica joins por linha) = a query mais cara do sistema, executada no endpoint de maior tráfego.

**Correção**: [[Indices-Recomendados]] (índice em `status`/`community_id`) + [[Problemas-de-Paginacao]] (paginação obrigatória) + [[Duplicidades-e-Oportunidades-de-Batch-Join]] (reduzir o `include`).

## 2. `GET /alerts/metrics` — dashboard por comunidade — 🟠 Alto

**Confirmado.** `AlertMetricsRepository.findByCommunityId` (`.../prisma-alert-metrics-repository.ts:10`) executa 3 queries em paralelo, todas filtrando por `communityId` sem índice de apoio:

```ts
this.prisma.alert.groupBy({ by: ["status"], where: { communityId }, _count: { _all: true } });

this.prisma.category.findMany({
  where: { alerts: { some: { communityId } } },
  select: { id: true, name: true, _count: { select: { alerts: { where: { communityId } } } } },
});

this.prisma.event.findMany({
  where: { alerts: { some: { alert: { communityId } } } },
  select: { id: true, name: true, _count: { select: { alerts: { where: { alert: { communityId } } } } } },
});
```

A 2ª e 3ª queries são as mais custosas: para **cada categoria** (e depois **cada evento**), Prisma gera uma subquery correlacionada `COUNT` filtrada por `communityId` contra `alerts` (a 3ª ainda passa por `alert_events`, que também não tem índice em `event_id`/`alert_id` fora da PK composta). Com N categorias e M eventos cadastrados, isso é efetivamente `1 (groupBy) + N (subqueries de categoria) + M (subqueries de evento)` varreduras de `alerts`/`alert_events`.

**Correção**: índice `alerts(community_id, status)` resolve a 1ª query. As 2ª/3ª se beneficiam do mesmo índice em `community_id`, mas o padrão "findMany + `_count` correlacionado por linha" continua caro — ver [[N1-Queries-Identificadas]] (é um N+1 de agregação, não de leitura simples) para a reescrita recomendada.

## 3. `GET /communities` — 🟡 Médio

**Confirmado.** `CommunityRepository.findManyWithQueries` (`.../prisma-community-repository.ts:14`) filtra por `biomeId` opcional — `communities.biome_id` não tem índice (só `slug` e a PK `id`). Sem paginação. Hoje o catálogo de comunidades é provavelmente pequeno (dado de referência), então o impacto real é **Hipótese** até validar volume — mas o índice ausente é **Confirmado**.

## 4. `Membership` por comunidade — 🟡 Médio

**Confirmado.** `MembershipRepository.findManyByCommunityId` e `findManyByCommunityIdsAndLeader` (`.../prisma-membership-repository.ts:12,29`) filtram por `communityId`. A tabela `memberships` só tem a PK composta `(user_id, community_id)` — como `community_id` não é a coluna mais à esquerda da PK, o Postgres **não pode usar essa chave** para uma busca só por `community_id` (só serviria para busca por `user_id` ou por `user_id + community_id` juntos). É Seq Scan confirmado pela ausência de índice dedicado.

## 5. Notificações — sem problema relevante — ✅

`NotificationRepository.findManyByRecipientId`/`findCountByRecipientId` filtram por `recipientId`, que **tem** índice (`@@index([recipientId])`, `notification.prisma:21`). O `OR` com `alert.status NOT IN (...)` faz join a `alerts` pela PK (`alert.id`), que já é indexada — não é um gargalo adicional relevante. Paginação por cursor implementada corretamente. **Boa prática a preservar.**

## Ver também

- [[Banco-de-Dados]] — índice
- [[Indices-Recomendados]]
- [[N1-Queries-Identificadas]]
