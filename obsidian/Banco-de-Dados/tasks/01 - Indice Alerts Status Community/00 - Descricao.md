---
title: Criar índices alerts(status) e alerts(community_id, status)
tags:
  - database
  - performance
  - indices
  - alta-prioridade
aliases:
  - Task 01
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Criar índices `alerts(status)` e `alerts(community_id, status)`

| | |
|---|---|
| **Impacto** | Alto |
| **Esforço** | Baixo |
| **Fonte** | [[Indices-Recomendados]] §1, [[Queries-Lentas-Documentadas]] §1-2 |

---

## O que precisa ser feito

A tabela `alerts` não tem nenhum índice além da PK (`id`). Todo `GET /alerts` (feed) e `GET /alerts/metrics` (dashboard) faz Seq Scan completo ao filtrar por `status` e/ou `community_id`.

## Como fazer

Adicionar em `apps/api/prisma/models/alert.prisma`, no `model Alert`:

```prisma
model Alert {
  // ...campos existentes...

  @@index([communityId, status])
  @@index([status])
  @@map("alerts")
}
```

Gerar a migration:

```bash
pnpm --filter api prisma migrate dev --name add_alerts_status_community_indices
```

Em produção, se a tabela já tiver volume relevante, aplicar via `CREATE INDEX CONCURRENTLY` manualmente antes de marcar a migration como aplicada, para não bloquear escrita:

```sql
CREATE INDEX CONCURRENTLY alerts_community_id_status_idx ON alerts (community_id, status);
CREATE INDEX CONCURRENTLY alerts_status_idx ON alerts (status);
```

## Como deve ficar o resultado

- `EXPLAIN` de `SELECT * FROM alerts WHERE status IN ('PENDING','ACCEPTED')` deixa de mostrar `Seq Scan on alerts` e passa a mostrar `Index Scan`/`Bitmap Index Scan` usando `alerts_status_idx`.
- `EXPLAIN` de `SELECT * FROM alerts WHERE community_id = '...' AND status = 'PENDING'` usa `alerts_community_id_status_idx`.
- `prisma migrate status` sem pendências.

## Ver também

- [[Banco-de-Dados]]
- [[00-To-Do-Geral]]
- [[01 - Indice Alerts Status Community/To-Do|To-Do]]
