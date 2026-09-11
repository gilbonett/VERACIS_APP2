---
title: To-Do - Remover Índices Duplicados Slug
tags:
  - database
  - tasks
aliases:
  - To-Do Task 02
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# To-Do

| | |
|---|---|
| **Task** | [[00 - Descricao\|Remover índices duplicados de slug]] |

---

- [ ] Remover `@@index([slug])` de `biome.prisma`, `community.prisma`, `event.prisma`, `risk.prisma`
- [ ] Rodar `prisma migrate dev --name drop_redundant_slug_indices`
- [ ] Confirmar no SQL gerado que só há `DROP INDEX`, nenhum `DROP` acidental do `UNIQUE`
- [ ] Rodar testes do domínio de comunidades/categorias/riscos
- [ ] Aplicar em produção
- [ ] Atualizar [[07-Plano-de-Acao-Priorizado]] marcando item 2 como concluído
