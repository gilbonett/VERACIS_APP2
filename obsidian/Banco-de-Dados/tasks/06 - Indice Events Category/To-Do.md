---
title: To-Do - Índice Events Category
tags:
  - database
  - tasks
aliases:
  - To-Do Task 06
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# To-Do

| | |
|---|---|
| **Task** | [[00 - Descricao\|Criar índice events(category_id)]] |

---

- [ ] Adicionar `@@index([categoryId])` em `event.prisma`
- [ ] Rodar `prisma migrate dev --name add_events_category_id_index`
- [ ] Confirmar `EXPLAIN` de `findManyByCategoryId` usando o novo índice
- [ ] Aplicar em produção
- [ ] Atualizar [[07-Plano-de-Acao-Priorizado]] marcando item 6 como concluído
