---
title: To-Do - Paginação Referência
tags:
  - database
  - tasks
aliases:
  - To-Do Task 10
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# To-Do

| | |
|---|---|
| **Task** | [[00 - Descricao\|Adicionar paginação em findAll de dados de referência]] |

---

- [ ] Decidir, por tabela, entre paginação e cache-only (documentar decisão na descrição da task)
- [ ] Implementar paginação por cursor em `CommunityRepository.findAll`/`findManyWithQueries` (prioridade dentro desta task)
- [ ] Avaliar necessidade real em `categories`/`biomes`/`risks` após decisão acima
- [ ] Atualizar controllers/use-cases correspondentes
- [ ] Atualizar [[07-Plano-de-Acao-Priorizado]] marcando item 10 como concluído
