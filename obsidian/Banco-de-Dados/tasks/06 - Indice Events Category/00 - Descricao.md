---
title: Criar índice events(category_id)
tags:
  - database
  - performance
  - indices
  - alta-prioridade
aliases:
  - Task 06
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Criar índice `events(category_id)`

| | |
|---|---|
| **Impacto** | Médio |
| **Esforço** | Baixo |
| **Fonte** | [[Indices-Recomendados]] §4 |

---

## O que precisa ser feito

`EventRepository.findManyByCategoryId` filtra por `categoryId`, sem índice hoje.

## Como fazer

Em `apps/api/prisma/models/event.prisma`:

```prisma
model Event {
  // ...
  @@index([categoryId])
  @@map("events")
}
```

```bash
pnpm --filter api prisma migrate dev --name add_events_category_id_index
```

## Como deve ficar o resultado

- `EXPLAIN` de `SELECT * FROM events WHERE category_id = '...'` usa `events_category_id_idx`.

## Ver também

- [[Banco-de-Dados]]
- [[00-To-Do-Geral]]
- [[06 - Indice Events Category/To-Do|To-Do]]
