---
title: Task 08 - Limpeza de dead code e TTLs nomeados
tags:
  - alerts
  - refactor
  - task
severidade: Baixa
esforco: Baixo
fase: 1
status: pendente
---

#alerts #refactor #task

# Task 08 — Dead code + TTLs como constantes de domínio

> Origem: [[06 - Duplicidades e Reuso#D5 — Dead code / parâmetros mortos (deletar, custo zero)|D5]] · [[Violações de Clean Architecture#V6 — Regra de negócio hardcoded em lugares errados|V6]] · TODO geral: [[00 - TODO Geral]]

## O que fazer

Deletar código morto mapeado na análise e nomear os TTLs de expiração como constantes de domínio. Custo ~zero, reduz ruído antes das tasks maiores.

## Como fazer

**Deletar:**

| Item | Local |
|---|---|
| `updateStatus` (contrato + impl) | `domain/alerts/repositories/alert-repository.ts:5` + `prisma-alert-repository.ts:25-30` |
| `include: { events, attachments }` ignorado pelo mapper | `prisma-alert-repository.ts` (`findById` e `findAll`) |
| Checagem `isRight()` de `Either<never>` + throw genérico | `infra/http/controllers/alerts/create-alert.controller.ts:37-39` |

*(`membershipRepository` e parâmetros mortos de `AlertReaction.create` já saem na [[04 - Extrair politica de confirmacao de reacao|Task 04]]; `AlertAcceptedEvent` deixa de ser morto na [[01 - Reativar AlertAcceptedEvent|Task 01]].)*

**Renomear:** `GetAlertMetrcisController` → `GetAlertMetricsController` (classe + import/registro no `http.module.ts`).

**Nomear TTLs** — criar `domain/alerts/policies/alert-expiration.ts`:

```ts
export const PENDING_ALERT_TTL_MS = 45 * 60 * 1000;  // Regras-de-Negocio/Alertas/05
export const ACCEPTED_ALERT_TTL_MS = 30 * 60 * 1000;
```

Substituir os literais nos subscribers `on-alert-created-schedule-*.ts` (e nos novos subscribers da Task 01).

> [!tip] Comentário sobre o include removido
> Ao remover o `include` do `findById`, deixar 1 linha no mapper documentando que o agregado reconstitui **sem coleções** (`hasEvents`/`hasAttachments` sempre false pós-load) — evita a pegadinha para o próximo dev ([[Violações de Clean Architecture#V5]]).

## Resultado esperado

- Zero referências a `updateStatus`; queries de `findById` sem joins inúteis.
- TTLs referenciados por nome, alinhados com a doc de regras de negócio.
- Typo corrigido; controllers compilando.

## Checklist

- [ ] `updateStatus` deletado (contrato + impl) — `grep updateStatus` limpo
- [ ] `include` removido de `findById`/`findAll` + comentário no mapper
- [ ] Checagem morta de `Either<never>` removida do controller
- [ ] `GetAlertMetrcis` → `GetAlertMetrics` (classe, arquivo, imports)
- [ ] `alert-expiration.ts` criado; literais 45/30min substituídos
- [ ] Build + suite verdes
