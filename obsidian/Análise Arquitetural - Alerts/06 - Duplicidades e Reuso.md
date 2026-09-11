---
title: Duplicidades e Reuso
tags:
  - refactor
  - alerts
  - ddd
---

#refactor #alerts #ddd

# Duplicidades e Oportunidades de Reuso

> Correções propostas em [[Refatoração Proposta - Use Cases]].

## D1 — Use cases de expiração gêmeos

`close-expired-pending-alert.ts` e `close-expired-accepted-alert.ts`: 44 linhas cada, diferem em **1 predicado e 1 erro** (`isPending`/`AlertNotPendingError` vs `isAccepted`/`AlertNotAcceptedError`). Proposta de unificação parametrizada em [[Refatoração Proposta - Use Cases#R4]] — com o trade-off honesto de que a duplicação é pequena e os erros distintos têm valor de telemetria. **Prioridade baixa.**

## D2 — Subscribers de expiração gêmeos

`on-alert-created-schedule-pending-expiration.ts` e `on-alert-created-schedule-accepted-expiration.ts`: mesma estrutura, guards espelhados, TTLs hardcoded distintos (45/30 min). A duplicação em si é tolerável (Observer favorece handlers pequenos e dedicados); o problema real é o **TTL como magic number em infra** ([[Violações de Clean Architecture#V6]]). Extrair para constantes de domínio nomeadas:

```ts
// domain/alerts/policies/alert-expiration.ts
export const PENDING_ALERT_TTL_MS = 45 * 60 * 1000;
export const ACCEPTED_ALERT_TTL_MS = 30 * 60 * 1000;
```

## D3 — Política de visibilidade com 2 variantes paralelas

`health-alert-visibility.ts` tem `canViewHealthAlert` (recebe `AlertDetails`, checa `events[].categoryId`) e `canViewHealthAlertByCategory` (recebe `categoryId` direto, checa `alert.categoryId`). Além da duplicação do miolo (já compartilham `canViewHealthAlertByRole` — bom), há uma **inconsistência semântica escondida**: uma variante considera "alerta de saúde" pela categoria dos *eventos*, a outra pela categoria do *alerta*. Se um alerta de categoria X contiver evento de saúde, as duas variantes divergem — comentário pode passar (via `canViewHealthAlert` sobre events) enquanto reação nega (via categoria direta), ou vice-versa.

> [!warning] Alinhar a definição de "alerta de saúde"
> Escolher **uma** fonte de verdade (categoria do alerta, ou existência de evento de saúde) e derivar as duas assinaturas dela. Hoje o comportamento pode divergir por caminho de código, não por regra de negócio.

## D4 — Validação "existe + posso ver" repetida em 3 use cases

`CreateAlertReactionUseCase`, `CreateAlertCommentUseCase` e `GetAlertByIdUseCase` repetem o par:

```ts
const alert = await repo.findById(alertId);
if (!alert) return left(new AlertNotFoundError());
if (!canViewHealthAlert...(...)) return left(new AlertNotFoundError());
```

Reuso possível: um helper de domínio `findVisibleAlert(repo, alertId, viewer): Either<AlertNotFoundError, T>`. Ganho moderado (3 call sites) — fazer junto com R1, não como refactor isolado.

## D5 — Dead code / parâmetros mortos (deletar, custo zero)

| Item                                                                            | Local                                                    |
| ------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `AlertRepository.updateStatus` (contrato + impl)                                | `alert-repository.ts:5`, `prisma-alert-repository.ts:25` |
| `membershipRepository` injetado sem uso                                         | `create-alert-reaction.ts:33`                            |
| `communityId`, `currentUserRole` em `AlertReaction.create`                      | `alert-reaction.ts:17-23`                                |
| `AlertAcceptedEvent` (ou reativar — ver [[Violações de Clean Architecture#V3]]) | `events/alert-accepted-event.ts`                         |
| Include `events`/`attachments` descartado pelo mapper                           | `prisma-alert-repository.ts:53-56`                       |
| Checagem `isRight()` de `Either<never>`                                         | `create-alert.controller.ts:37`                          |
| Typo `GetAlertMetrcisController`                                                | `get-alert-metrics.controller.ts`                        |

## D6 — `UserRole` importado de `domain/users` em 6+ arquivos do Alerts

Shared kernel implícito — formalizar em `@/core` ou `@/shared` ([[Dependências Indevidas entre Camadas]]).

## O que **não** é duplicação (falso positivo comum)

> [!tip] Mappers e presenters "parecidos" são saudáveis
> Os 7 mappers Prisma e os presenters seguem o mesmo esqueleto — isso é **consistência**, não duplicação: cada um traduz um shape diferente. Generalizar mapper genérico por reflexão destruiria a clareza por economizar linhas triviais.
