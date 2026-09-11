---
title: Criar índice memberships(community_id)
tags:
  - database
  - performance
  - indices
  - alta-prioridade
aliases:
  - Task 04
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Criar índice `memberships(community_id)`

| | |
|---|---|
| **Impacto** | Médio |
| **Esforço** | Baixo |
| **Fonte** | [[Indices-Recomendados]] §2, [[Queries-Lentas-Documentadas]] §4 |

---

## O que precisa ser feito

`memberships` só tem a PK composta `(user_id, community_id)`. `MembershipRepository.findManyByCommunityId` e `findManyByCommunityIdsAndLeader` filtram só por `community_id`, que não é a coluna mais à esquerda da PK — Postgres não pode usar a PK para essa busca, resultando em Seq Scan.

## Como fazer

Em `apps/api/prisma/models/membership.prisma`:

```prisma
model Membership {
  // ...campos existentes...

  @@id([userId, communityId])
  @@index([communityId])
  @@map("memberships")
}
```

```bash
pnpm --filter api prisma migrate dev --name add_memberships_community_id_index
```

## Como deve ficar o resultado

- `EXPLAIN` de `SELECT * FROM memberships WHERE community_id = '...'` usa `memberships_community_id_idx` em vez de Seq Scan.
- Endpoint que lista membros/líderes de uma comunidade responde sem degradar com o crescimento da tabela.

## Ver também

- [[Banco-de-Dados]]
- [[00-To-Do-Geral]]
- [[04 - Indice Memberships Community/To-Do|To-Do]]
