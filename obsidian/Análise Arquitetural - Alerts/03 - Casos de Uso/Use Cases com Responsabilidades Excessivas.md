---
title: Use Cases com Responsabilidades Excessivas
tags:
  - ddd
  - alerts
  - refactor
  - solid
---

#ddd #alerts #refactor

# Use Cases com Responsabilidades Excessivas

> Refatorações concretas em [[Refatoração Proposta - Use Cases]].

## Inventário dos 10 use cases

| Use case | Responsabilidades | SRP | Severidade |
|---|---|---|---|
| `CreateAlertReactionUseCase` | busca alerta, valida status, valida visibilidade, valida duplicidade, cria reação, **decide confirmação por 3 regras distintas**, persiste 2 agregados | ❌ | **Alta** |
| `GetAlertMetricsByCommunityIdUseCase` | busca user, **infere comunidade por `[0]`**, busca métricas | ⚠️ | Média |
| `CreateAlertCommentUseCase` | valida existência+visibilidade, cria comment | ✅ ok | — |
| `CreateAlertUseCase` | delega a `Alert.create` + persiste | ✅ exemplar | — |
| `CloseExpiredPendingAlertUseCase` | busca, valida, fecha | ✅ (duplicado, ver [[06 - Duplicidades e Reuso]]) | Baixa |
| `CloseExpiredAcceptedAlertUseCase` | idem | ✅ (duplicado) | Baixa |
| `GetAlertsUseCase` / `GetAlertByIdUseCase` | query + filtro de visibilidade | ✅ | — |
| `CreateAlertAttachmentUseCase` | cria vínculo (sem validar alerta) | ⚠️ | Baixa |

## Caso crítico: `CreateAlertReactionUseCase`

`domain/alerts/use-cases/create-alert-reaction.ts` — 115 linhas, o único God use case do subdomain. Fluxo atual:

```ts
async execute({ type, authorId, alertId, currentUserRole }) {
  const alert = await this.alertRepository.findById(alertId);
  if (!alert) return left(new AlertNotFoundError());
  if (alert.status !== "PENDING") return left(new AlertNotOpenForReactionsError());
  if (!canViewHealthAlertByCategory({ ... })) return left(new AlertNotFoundError());

  const reaction = await this.alertReactionRepository.findByAlertIdAndAuthorId(alertId, authorId);
  if (reaction) return left(new ReactionAlreadyExistsError());

  const newReaction = AlertReaction.create({ ... });
  await this.alertReactionRepository.create(newReaction);

  // ── daqui para baixo: REGRA DE NEGÓCIO de confirmação, inline ──
  if (currentUserRole !== "MEMBER") {            // regra 1: staff confirma
    alert.doAccept(); await this.alertRepository.save(alert);
    return right({ reaction: newReaction });
  }
  if (type === "LIKE" && memberSingleClickLikeConfirmsAlert(authorId)) {  // regra 2: coringa
    alert.doAccept(); await this.alertRepository.save(alert);
    return right({ reaction: newReaction });
  }
  const reactionTotalLikes = await this.alertReactionRepository
    .findCountByAlertIdAndLiked(alertId.toString());
  const minimumToConfirm = 5;                    // regra 3: quórum — magic number
  if (reactionTotalLikes >= minimumToConfirm) {
    alert.doAccept(); await this.alertRepository.save(alert);
  }
  return right({ reaction: newReaction });
}
```

Problemas específicos:

> [!warning] Cinco problemas num único método
> 1. **Regra de negócio central** (quando a comunidade confirma um alerta) espalhada em 3 `if`s no use case, invisível para o domínio. É exatamente a regra documentada em `Regras-de-Negocio/Alertas/03-Confirmacao-Comunitaria`.
> 2. **Magic number** `minimumToConfirm = 5` inline.
> 3. **Dependência morta**: `membershipRepository` injetado e nunca usado.
> 4. **Parâmetros mortos**: `AlertReaction.create` recebe `communityId` e `currentUserRole` e descarta ambos (`entities/alert-reaction.ts:17-23`).
> 5. **Sem transação**: reação persistida e `alert.doAccept()+save` são writes separados — falha no meio deixa reação registrada e alerta não confirmado (auto-corrigível por reação futura, mas inconsistente).
> Bônus: como `doAccept()` não emite evento ([[Violações de Clean Architecture#V3]]), a confirmação não dispara nenhum efeito de ciclo de vida.

## Caso médio: `GetAlertMetricsByCommunityIdUseCase`

```ts
const communityId = user.communities.currentItems[0].communityId;
```

- **Crash em runtime** (`TypeError`) se o usuário não tem comunidade — `currentItems[0]` sem guard.
- Regra implícita "usuário pertence a exatamente 1 comunidade" codificada por indexação, não por contrato. Se multi-comunidade chegar, esse use case falha silenciosamente (pega a primeira).
- Acoplamento a `UserRepository` só para resolver a comunidade — o controller já tem a sessão; se a sessão carregasse `communityId`, o use case perderia uma dependência inteira.

## Anti-caso (elogio): `CreateAlertUseCase`

```ts
async execute(data) {
  const alert = Alert.create(data);   // toda a regra no agregado
  await this.alertRepository.create(alert);
  return right({ alert });
}
```

> [!tip] Este é o padrão a replicar
> Orquestração mínima; decisões (status inicial, auto-aceite por role, associações, evento) vivem em `Alert.create`. O `CreateAlertReactionUseCase` refatorado deve se parecer com isso — ver [[Refatoração Proposta - Use Cases]].
