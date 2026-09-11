---
title: Criar índice communities(biome_id)
tags:
  - database
  - performance
  - indices
  - alta-prioridade
aliases:
  - Task 05
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Criar índice `communities(biome_id)`

| | |
|---|---|
| **Impacto** | Médio |
| **Esforço** | Baixo |
| **Fonte** | [[Indices-Recomendados]] §3, [[Queries-Lentas-Documentadas]] §3 |

---

## O que precisa ser feito

`CommunityRepository.findManyWithQueries` filtra opcionalmente por `biomeId`, coluna sem índice hoje (só `slug` e a PK têm índice).

## Como fazer

Em `apps/api/prisma/models/community.prisma`:

```prisma
model Community {
  // ...
  @@index([slug])   -- removido na task 02
  @@index([biomeId])
  @@map("communities")
}
```

```bash
pnpm --filter api prisma migrate dev --name add_communities_biome_id_index
```

## Como deve ficar o resultado

- `EXPLAIN` de `SELECT * FROM communities WHERE biome_id = '...'` usa `communities_biome_id_idx`.

## Ver também

- [[Banco-de-Dados]]
- [[00-To-Do-Geral]]
- [[05 - Indice Communities Biome/To-Do|To-Do]]
