---
title: To-Do - Job Limpeza Sessões
tags:
  - database
  - tasks
aliases:
  - To-Do Task 13
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# To-Do

| | |
|---|---|
| **Task** | [[00 - Descricao\|Implementar exclusão real em OnCleanExpiredSessionTask]] |

---

- [ ] Adicionar `deleteExpired()` ao contrato `SessionRepository`
- [ ] Implementar em `PrismaSessionRepository` com `deleteMany({ where: { expiresAt: { lt: new Date() } } })`
- [ ] Chamar `deleteExpired()` dentro de `OnCleanExpiredSessionTask`
- [ ] Rodar o cron manualmente em ambiente local, confirmar exclusão de sessões expiradas de teste
- [ ] Monitorar `COUNT(*) FROM sessions` em produção nas primeiras execuções após o deploy
- [ ] Atualizar [[07-Plano-de-Acao-Priorizado]] marcando item 13 como concluído
