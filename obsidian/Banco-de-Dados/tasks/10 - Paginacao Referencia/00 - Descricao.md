---
title: Adicionar paginação em findAll de dados de referência
tags:
  - database
  - performance
  - paginacao
  - media-prioridade
aliases:
  - Task 10
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Adicionar paginação em `findAll` de `communities`/`categories`/`biomes`/`risks`

| | |
|---|---|
| **Impacto** | Médio |
| **Esforço** | Médio |
| **Fonte** | [[Problemas-de-Paginacao]] §3 |

---

## O que precisa ser feito

`CommunityRepository.findAll`/`findManyWithQueries`, `CategoryRepository.findAll`, `BiomeRepository.findAll` e `RiskRepository.findMany` não têm paginação. São endpoints HTTP expostos (`GET /communities`, `GET /categories`, `GET /biomes`, `GET /risks`).

## Como fazer

Mesmo padrão de cursor de `NotificationRepository`/task 08. Como estas são tabelas de referência com atualização rara, considerar como alternativa complementar o cache (task 11) antes de investir em paginação nas rotas de menor volume — priorizar paginação onde o crescimento é mais certo (`communities`, que cresce por novo território cadastrado) e cache onde o conjunto é praticamente fixo (`categories`, `biomes`, `risks`).

## Como deve ficar o resultado

- `GET /communities?cursor=...&limit=...` (e equivalentes) retornam página limitada + `nextCursor`.
- Catálogos pequenos hoje (`categories`, `biomes`, `risks`) podem, alternativamente, ser resolvidos só com cache (task 11) sem paginação, se o time decidir que o volume nunca justificará paginação de fato — documentar a decisão tomada nesta nota quando executada.

## Ver também

- [[Banco-de-Dados]]
- [[00-To-Do-Geral]]
- [[10 - Paginacao Referencia/To-Do|To-Do]]
- [[11 - Cache Referencia/00 - Descricao|Cache Redis para dados de referência]]
