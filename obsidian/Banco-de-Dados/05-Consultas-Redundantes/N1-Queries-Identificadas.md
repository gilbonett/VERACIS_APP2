---
title: N+1 Queries Identificadas - Banco de Dados
tags:
  - database
  - performance
  - n1
  - refactor
aliases:
  - N+1 Queries
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# N+1 Queries Identificadas

| | |
|---|---|
| **Domínio** | [[Banco-de-Dados\|Banco de Dados]] |
| **Última atualização** | 2026-07-24 |

---

> [!tip] Não há chamada de repositório dentro de um loop de aplicação em nenhum lugar do código (`grep` dirigido não encontrou esse padrão clássico de N+1). O padrão problemático encontrado é mais sutil: **N+1 de agregação via Prisma `_count` correlacionado**, e **`include` aninhado que expande a query, não que a repete**.

## 1. N+1 de Agregação em `AlertMetricsRepository.findByCommunityId` — 🔴 Confirmado

`apps/api/src/infra/database/prisma/alerts/repositories/prisma-alert-metrics-repository.ts:19-33`:

```ts
this.prisma.category.findMany({
  where: { alerts: { some: { communityId } } },
  select: {
    id: true,
    name: true,
    _count: { select: { alerts: { where: { communityId } } } }, // 1 subquery por categoria
  },
});

this.prisma.event.findMany({
  where: { alerts: { some: { alert: { communityId } } } },
  select: {
    id: true,
    name: true,
    _count: { select: { alerts: { where: { alert: { communityId } } } } }, // 1 subquery por evento
  },
});
```

Não é um N+1 de round-trips ao banco (Prisma gera SQL com subquery correlacionada, uma única ida ao Postgres por chamada), mas é um **N+1 de trabalho de execução dentro do banco**: para cada uma das N categorias e M eventos cadastrados, o Postgres executa uma subquery `COUNT` filtrada por `community_id` contra `alerts` (a de eventos ainda passa por `alert_events`). Sem os índices de [[Indices-Recomendados]], cada subquery é um Seq Scan — n subqueries × Seq Scan é, na prática, tão caro quanto n round-trips separados.

**Correção recomendada**: substituir os 2 `findMany + _count` por 2 `groupBy` diretos, no mesmo padrão já usado para `status`:

```ts
// categorias
this.prisma.alert.groupBy({
  by: ["categoryId"],
  where: { communityId },
  _count: { _all: true },
});

// eventos — precisa passar por alert_events, então via tabela de junção
this.prisma.alertEvent.groupBy({
  by: ["eventId"],
  where: { alert: { communityId } },
  _count: { _all: true },
});
```

Isso reduz de `1 + N + M` varreduras para `3` `groupBy` (status, categoria, evento), todas se beneficiando do índice `alerts (community_id, status)` recomendado. Nomes (`category.name`, `event.name`) exigem um segundo `findMany` simples por `id IN (...)` — ainda assim, 2 queries pequenas por tipo em vez de N/M subqueries correlacionadas.

## 2. `include` aninhado de 3 níveis em `UserRepository` — 🟡 Confirmado, impacto Baixo-Médio

`findByEmail`, `findByCpf`, `findByPhone` e `findById` em `prisma-user-repository.ts` sempre trazem:

```ts
include: { memberships: { include: { community: { include: { biome: true } } } } }
```

Não é N+1 (Prisma faz um único `LEFT JOIN` em cascata), mas é over-fetch: todo login, toda leitura de perfil e todo lookup de usuário paga o custo de 3 joins adicionais mesmo quando o caller não precisa de `memberships`/`community`/`biome` — por exemplo, `SignInUseCase` só usa `user.password` e `user.otpEnabled` (ver `sign-in.use-case.ts:52-60`), nunca acessa `memberships`.

**Correção**: mover `memberships` para um método separado (`findByIdWithMemberships` ou carregar via `MembershipRepository` só quando o caller precisar), deixando `findByEmail`/`findByCpf`/`findById` sem include por padrão. Ver [[Duplicidades-e-Oportunidades-de-Batch-Join]] para o detalhamento do `include` de `Alert`.

## 3. Ausência de N+1 clássico — 🟢 Boa prática confirmada

`createMany`/`deleteMany`/`updateMany` são usados consistentemente para operações em lote (`AlertEventsRepository.createMany`, `AlertRiskRepository.deleteMany`, `MembershipRepository.removeMany` com cláusula `OR`, `OtpChallengeRepository.expirePendingByUserId` com `updateMany`). Nenhum loop de aplicação chamando repositório item a item foi encontrado — o padrão de batch já está bem estabelecido no projeto e deve ser mantido como referência para código novo.

## Ver também

- [[Banco-de-Dados]] — índice
- [[Duplicidades-e-Oportunidades-de-Batch-Join]]
- [[Queries-Lentas-Documentadas]]
