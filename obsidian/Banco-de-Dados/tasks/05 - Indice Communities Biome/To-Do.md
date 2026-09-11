---
title: To-Do - Índice Communities Biome
tags:
  - database
  - tasks
aliases:
  - To-Do Task 05
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# To-Do

| | |
|---|---|
| **Task** | [[00 - Descricao\|Criar índice communities(biome_id)]] |

---

- [ ] Adicionar `@@index([biomeId])` em `community.prisma`
- [ ] Rodar `prisma migrate dev --name add_communities_biome_id_index`
- [ ] Confirmar `EXPLAIN` de `findManyWithQueries({ biomeId })` usando o novo índice
- [ ] Aplicar em produção
- [ ] Atualizar [[07-Plano-de-Acao-Priorizado]] marcando item 5 como concluído
