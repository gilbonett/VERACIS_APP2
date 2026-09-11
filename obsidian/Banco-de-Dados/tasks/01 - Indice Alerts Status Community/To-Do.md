---
title: To-Do - Índice Alerts Status Community
tags:
  - database
  - tasks
aliases:
  - To-Do Task 01
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# To-Do

| | |
|---|---|
| **Task** | [[00 - Descricao\|Criar índices alerts(status) e alerts(community_id, status)]] |

---

- [ ] Adicionar `@@index([communityId, status])` e `@@index([status])` em `prisma/models/alert.prisma`
- [ ] Rodar `prisma migrate dev --name add_alerts_status_community_indices` em ambiente local
- [ ] Revisar o SQL gerado (confirma `CREATE INDEX` nas colunas certas)
- [ ] Rodar `EXPLAIN` na query de `AlertDetailsRepository.findMany` local com dado de teste, confirmar uso do índice
- [ ] Rodar `EXPLAIN` na query `groupBy` de `AlertMetricsRepository.findByCommunityId`, confirmar uso do índice
- [ ] Aplicar em produção (via `CONCURRENTLY` se volume justificar) e marcar migration como resolvida
- [ ] Atualizar [[07-Plano-de-Acao-Priorizado]] marcando item 1 como concluído
