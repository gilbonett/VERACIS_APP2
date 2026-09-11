---
title: To-Do - Cache Referência
tags:
  - database
  - tasks
aliases:
  - To-Do Task 11
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# To-Do

| | |
|---|---|
| **Task** | [[00 - Descricao\|Cache Redis para dados de referência]] |

---

- [ ] Implementar cache-aside em `CategoryRepository`
- [ ] Implementar cache-aside em `BiomeRepository`
- [ ] Implementar cache-aside em `RiskRepository`
- [ ] Implementar cache-aside em `EventRepository`
- [ ] Implementar cache-aside em `CommunityRepository`
- [ ] Invalidar cache em cada `save`/`create`/`delete` correspondente
- [ ] Rodar testes de cada domínio afetado
- [ ] Atualizar [[07-Plano-de-Acao-Priorizado]] marcando item 11 como concluído
