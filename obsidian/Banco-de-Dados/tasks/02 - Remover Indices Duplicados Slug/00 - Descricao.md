---
title: Remover índices duplicados de slug
tags:
  - database
  - performance
  - indices
  - alta-prioridade
aliases:
  - Task 02
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Remover índices duplicados de `slug`

| | |
|---|---|
| **Impacto** | Baixo (ganho direto) / evita débito de escrita |
| **Esforço** | Baixo |
| **Fonte** | [[Indices-Redundantes-ou-Nao-Utilizados]] §1 |

---

## O que precisa ser feito

`Biome`, `Community`, `Event` e `Risk` têm `slug String @unique` **e** `@@index([slug])` — dois índices na mesma coluna. O `@unique` já cria um índice único que cobre qualquer busca por igualdade; o `@@index` extra só custa em `INSERT`/`UPDATE`, sem ganho de leitura.

## Como fazer

Remover a linha `@@index([slug])` de cada um dos 4 arquivos:

- `apps/api/prisma/models/biome.prisma`
- `apps/api/prisma/models/community.prisma`
- `apps/api/prisma/models/event.prisma`
- `apps/api/prisma/models/risk.prisma`

Gerar migration:

```bash
pnpm --filter api prisma migrate dev --name drop_redundant_slug_indices
```

O SQL gerado deve conter:

```sql
DROP INDEX "biomes_slug_idx";
DROP INDEX "communities_slug_idx";
DROP INDEX "events_slug_idx";
DROP INDEX "risks_slug_idx";
```

## Como deve ficar o resultado

- `\d biomes` (e as outras 3 tabelas) no `psql` mostra só um índice em `slug` (o `UNIQUE`).
- Buscas por `findBySlug`/lookup por slug continuam funcionando (usam o índice único remanescente) — confirmar rodando os testes existentes do domínio afetado.

## Ver também

- [[Banco-de-Dados]]
- [[00-To-Do-Geral]]
- [[02 - Remover Indices Duplicados Slug/To-Do|To-Do]]
