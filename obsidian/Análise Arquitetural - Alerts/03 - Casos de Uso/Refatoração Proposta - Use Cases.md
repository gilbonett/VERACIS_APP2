---
title: Refatoração Proposta - Use Cases
tags:
  - refactor
  - ddd
  - alerts
  - gof
---

#refactor #ddd #alerts #gof

# Refatoração Proposta — Use Cases

> Problemas descritos em [[Use Cases com Responsabilidades Excessivas]]. Padrões justificados em [[Comportamentais]].

## R1 — Extrair política de confirmação (`CreateAlertReactionUseCase`)

A decisão "esta reação confirma o alerta?" é regra de domínio. Uma **função pura** (Specification informal, mesmo estilo já usado em `policies/health-alert-visibility.ts`) basta — Strategy com classes seria cerimônia sem ganho aqui, pois as regras não variam por configuração em runtime.

**Nova política de domínio** (`domain/alerts/policies/alert-confirmation.ts`):

```ts
import { UserRole } from "@/domain/users/entities/user";
import { memberSingleClickLikeConfirmsAlert } from "./single-click-alert-confirmation";

export const MINIMUM_LIKES_TO_CONFIRM = 5;

type ConfirmationContext = {
  reactionType: "LIKE" | "DISLIKE";
  authorId: string;
  authorRole: UserRole;
  totalLikes: number; // já contando a reação atual
};

/** Regras de Confirmacao-Comunitaria (03): staff, coringa ou quórum. */
export function reactionConfirmsAlert(ctx: ConfirmationContext): boolean {
  if (ctx.authorRole !== "MEMBER") return true;
  if (ctx.reactionType !== "LIKE") return false;
  if (memberSingleClickLikeConfirmsAlert(ctx.authorId)) return true;
  return ctx.totalLikes >= MINIMUM_LIKES_TO_CONFIRM;
}
```

**Use case depois** (orquestração pura, 1 caminho de escrita):

```ts
async execute({ type, authorId, alertId, currentUserRole }) {
  const alert = await this.alertRepository.findById(alertId);
  if (!alert) return left(new AlertNotFoundError());
  if (!alert.isPending) return left(new AlertNotOpenForReactionsError());
  if (!canViewHealthAlertByCategory({ ... })) return left(new AlertNotFoundError());

  const existing = await this.alertReactionRepository
    .findByAlertIdAndAuthorId(alertId, authorId);
  if (existing) return left(new ReactionAlreadyExistsError());

  const reaction = AlertReaction.create({ type, alertId: ..., authorId: ... });
  await this.alertReactionRepository.create(reaction);

  const totalLikes = type === "LIKE"
    ? await this.alertReactionRepository.findCountByAlertIdAndLiked(alertId)
    : 0;

  if (reactionConfirmsAlert({ reactionType: type, authorId,
      authorRole: currentUserRole, totalLikes })) {
    alert.doAccept();               // passa a emitir AlertAcceptedEvent (R2)
    await this.alertRepository.save(alert);
  }

  return right({ reaction });
}
```

Ganhos: regra testável isolada (mesmo estilo do spec existente de `health-alert-visibility`), magic number nomeado, 3 caminhos de escrita colapsados em 1. Remover também `membershipRepository` (injeção morta) e os parâmetros mortos de `AlertReaction.create`.

## R2 — Reativar `AlertAcceptedEvent` e mover efeitos para subscribers

**`alert.ts` depois:**

```ts
public doAccept() {
  if (!this.isPending) return; // transição inválida vira no-op explícito
  this.props.status = "ACCEPTED";
  this.addDomainEvent(
    new AlertAcceptedEvent(this.id, this.props.authorId,
      this.props.communityId, this.props.categoryId),
  );
  this.touch();
}
```

**Novo subscriber de infra** (`infra/events/alerts/on-alert-accepted-reschedule-expiration.ts`), espelhando o padrão Observer já existente:

```ts
setupSubscriptions(): void {
  DomainEvents.register(this.handle.bind(this), AlertAcceptedEvent.name);
}

private async handle(event: AlertAcceptedEvent) {
  await this.dispatcher.cancelPending(event.alertId.toString());
  await this.dispatcher.scheduleAccepted(event.alertId.toString(), ACCEPTED_TTL_MS);
}
```

E registrar `OnAlertCreatedNotifyMembers` (ou um novo `OnAlertAcceptedNotifyMembers`) também para `AlertAcceptedEvent` — hoje a comunidade nunca é notificada da própria confirmação ([[Violações de Clean Architecture#V3]]).

> [!warning] Cuidado com criação + aceite
> `Alert.create` com role ≠ MEMBER chama `doAccept()` → passaria a emitir `AlertCreatedEvent` **e** `AlertAcceptedEvent`. Os subscribers de created com guard `status === "ACCEPTED"` devem migrar para o evento accepted (fonte única), senão haverá agendamento duplo. O `jobId: alertId` do BullMQ já protege contra duplicata de job, mas a notificação duplicaria.

## R3 — Guard em `GetAlertMetricsByCommunityIdUseCase`

```ts
const membership = user.communities.currentItems.at(0);
if (!membership) return left(new UserNotFoundError()); // ou erro dedicado
const communityId = membership.communityId;
```

Correção de 3 linhas para o crash. A remoção da dependência de `UserRepository` (comunidade via sessão) é melhoria opcional de segunda ordem.

## R4 — Unificar `CloseExpiredPendingAlert` / `CloseExpiredAcceptedAlert`

Ver [[06 - Duplicidades e Reuso]] — os dois use cases diferem em 1 linha de validação. Um `CloseExpiredAlertUseCase` parametrizado pelo status esperado elimina o par:

```ts
interface Request { alertId: string; expectedStatus: "PENDING" | "ACCEPTED"; }

async execute({ alertId, expectedStatus }) {
  const alert = await this.alertRepository.findById(alertId);
  if (!alert) return left(new AlertNotFoundError());
  if (alert.status !== expectedStatus) return left(new AlertNotInExpectedStatusError(expectedStatus));
  alert.doClose();
  await this.alertRepository.save(alert);
  return right(undefined);
}
```

Trade-off: perde-se o erro específico por status (`AlertNotPendingError` vs `AlertNotAcceptedError`). Se os erros distintos importarem para telemetria, manter os dois use cases é defensável — a duplicação é pequena. **Prioridade baixa.**

## R5 — Tirar telemetria do domínio

Opções, da mais correta à mais pragmática:

1. **Interceptor NestJS** no controller (borda) — telemetria de negócio vira concern de apresentação.
2. **Decorar o provider** no módulo: `{ provide: CreateAlertUseCase, useFactory: (repo) => observed(new CreateAlertUseCase(repo)) }` — GoF Decorator de verdade, domínio intocado.
3. **Mover o decorator** para `@/shared/telemetry` sem imports de infra — resolve o import path, não a dependência conceitual.

Opção 2 é a que preserva a telemetria por fluxo (`flow: "alert"`) sem sujar o domínio. Ver [[Estruturais]] (Decorator).
