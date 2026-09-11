---
title: To-Do - Paginação Get Alerts
tags:
  - database
  - tasks
aliases:
  - To-Do Task 08
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# To-Do

| | |
|---|---|
| **Task** | [[00 - Descricao\|Adicionar paginação por cursor em GET /alerts]] |

---

- [ ] Adicionar `cursor`/`limit` a `IAlertDetailsQuery`
- [ ] Adicionar `orderBy`/`take`/`skip`/`cursor` em `PrismaAlertDetailsRepository.findMany`
- [ ] Retornar `{ alerts, nextCursor }` do repositório
- [ ] Atualizar `GetAlertsUseCase` e o controller `GET /alerts`
- [ ] Alinhar com o frontend a mudança de contrato da resposta
- [ ] Atualizar/adicionar testes de `GetAlertsUseCase` cobrindo paginação
- [ ] Atualizar [[07-Plano-de-Acao-Priorizado]] marcando item 8 como concluído
