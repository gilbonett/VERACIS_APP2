---
title: Reescrever AlertMetricsRepository com groupBy
tags:
  - database
  - performance
  - refactor
  - media-prioridade
aliases:
  - Task 09
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Reescrever `AlertMetricsRepository.findByCommunityId` com `groupBy`

| | |
|---|---|
| **Impacto** | Médio-Alto |
| **Esforço** | Médio |
| **Fonte** | [[N1-Queries-Identificadas]] §1 |

---

## O que precisa ser feito

As queries de categoria e evento em `findByCommunityId` usam `findMany` + `_count` correlacionado por linha — 1 subquery por categoria e 1 por evento cadastrado, contra `alerts`/`alert_events`.

## Como fazer

Em `apps/api/src/infra/database/prisma/alerts/repositories/prisma-alert-metrics-repository.ts`, substituir:

```ts
this.prisma.category.findMany({
  where: { alerts: { some: { communityId } } },
  select: { id: true, name: true, _count: { select: { alerts: { where: { communityId } } } } },
});
```

por um `groupBy` seguido de um `findMany` simples para resolver os nomes:

```ts
const categoryCounts = await this.prisma.alert.groupBy({
  by: ["categoryId"],
  where: { communityId },
  _count: { _all: true },
});
const categories = await this.prisma.category.findMany({
  where: { id: { in: categoryCounts.map((c) => c.categoryId) } },
  select: { id: true, name: true },
});
```

Repetir o padrão para eventos, usando `this.prisma.alertEvent.groupBy({ by: ["eventId"], where: { alert: { communityId } }, _count: { _all: true } })` seguido de `event.findMany({ where: { id: { in: [...] } } })`.

## Como deve ficar o resultado

- Número de queries deixa de escalar com o número de categorias/eventos cadastrados (passa de `1+N+M` para `4` queries fixas: 3 `groupBy` + resolução de nomes).
- `AlertMetrics.reconstitute` continua recebendo o mesmo shape de dados (`{ categoryId, categoryName, count }[]` e `{ eventId, eventName, alertsCount }[]`) — só a origem dos dados muda, não o contrato do domínio.
- Testes de `GetAlertMetricsByCommunityIdUseCase` continuam passando sem alteração de asserção.

## Ver também

- [[Banco-de-Dados]]
- [[00-To-Do-Geral]]
- [[09 - Groupby Alert Metrics/To-Do|To-Do]]
