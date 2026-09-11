---
title: To-Do - Índice Memberships Community
tags:
  - database
  - tasks
aliases:
  - To-Do Task 04
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# To-Do

| | |
|---|---|
| **Task** | [[00 - Descricao\|Criar índice memberships(community_id)]] |

---

- [ ] Adicionar `@@index([communityId])` em `membership.prisma`
- [ ] Rodar `prisma migrate dev --name add_memberships_community_id_index`
- [ ] Confirmar `EXPLAIN` de `findManyByCommunityId` usando o novo índice
- [ ] Aplicar em produção
- [ ] Atualizar [[07-Plano-de-Acao-Priorizado]] marcando item 4 como concluído
