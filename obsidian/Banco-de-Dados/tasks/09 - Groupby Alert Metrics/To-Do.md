---
title: To-Do - GroupBy Alert Metrics
tags:
  - database
  - tasks
aliases:
  - To-Do Task 09
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# To-Do

| | |
|---|---|
| **Task** | [[00 - Descricao\|Reescrever AlertMetricsRepository com groupBy]] |

---

- [ ] Reescrever a query de categorias com `alert.groupBy(by: categoryId)` + `category.findMany`
- [ ] Reescrever a query de eventos com `alertEvent.groupBy(by: eventId)` + `event.findMany`
- [ ] Confirmar que `AlertMetrics.reconstitute` recebe o mesmo shape de dados
- [ ] Rodar testes de `GetAlertMetricsByCommunityIdUseCase`
- [ ] Confirmar via `EXPLAIN` que o número de scans não cresce mais com o número de categorias/eventos
- [ ] Atualizar [[07-Plano-de-Acao-Priorizado]] marcando item 9 como concluído
