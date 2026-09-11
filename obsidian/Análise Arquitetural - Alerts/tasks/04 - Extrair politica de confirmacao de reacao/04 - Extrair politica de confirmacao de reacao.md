---
title: Task 04 - Extrair política de confirmação de reação
tags:
  - alerts
  - refactor
  - gof
  - task
severidade: Média
esforco: Baixo
fase: 1
status: pendente
---

#alerts #refactor #gof #task

# Task 04 — Extrair política de confirmação (`reactionConfirmsAlert`)

> Origem: [[Use Cases com Responsabilidades Excessivas#Caso crítico: `CreateAlertReactionUseCase`|God use case]] · [[Refatoração Proposta - Use Cases#R1 — Extrair política de confirmação (`CreateAlertReactionUseCase`)|R1]] · [[Comportamentais#Strategy — ⚠️ deveria existir (na forma leve)|Strategy leve]] · TODO geral: [[00 - TODO Geral]]

## O que fazer

`CreateAlertReactionUseCase` decide confirmação do alerta com 3 regras inline (staff, membro coringa, quórum de 5 likes) + magic number + dependência morta (`membershipRepository`) + parâmetros mortos em `AlertReaction.create`. Extrair a decisão para política pura de domínio, no mesmo estilo de `policies/health-alert-visibility.ts`.

## Como fazer

1. Criar `apps/api/src/domain/alerts/policies/alert-confirmation.ts`:

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

export function reactionConfirmsAlert(ctx: ConfirmationContext): boolean {
  if (ctx.authorRole !== "MEMBER") return true;
  if (ctx.reactionType !== "LIKE") return false;
  if (memberSingleClickLikeConfirmsAlert(ctx.authorId)) return true;
  return ctx.totalLikes >= MINIMUM_LIKES_TO_CONFIRM;
}
```

2. Refatorar o use case: os 3 caminhos de escrita viram 1 (`if (reactionConfirmsAlert(...)) { alert.doAccept(); save; }`) — código completo em [[Refatoração Proposta - Use Cases#R1]].
3. Remover `membershipRepository` do construtor (e do wiring no módulo, se listado).
4. Remover `communityId` e `currentUserRole` de `CreateAlertReactionProps` em `entities/alert-reaction.ts` + ajustar call site.
5. Exportar a política em `policies/index.ts` (seguir padrão existente).
6. Atualizar `create-alert-reaction.spec.ts` + criar `alert-confirmation.spec.ts`.

> [!warning] Atenção ao caso staff
> Hoje staff confirma com LIKE **ou** DISLIKE (o `if (currentUserRole !== "MEMBER")` roda antes da checagem de tipo). A política proposta preserva isso (`authorRole !== "MEMBER"` antes do check de LIKE). Confirmar com o time se DISLIKE de staff confirmando alerta é intencional — se não for, corrigir na política e documentar em `Regras-de-Negocio/Alertas/03-Confirmacao-Comunitaria`.

## Resultado esperado

- Regra de confirmação num único lugar, testável sem mocks.
- Use case reduzido a orquestração (busca, valida, cria, aplica política, persiste).
- Zero dependências/parâmetros mortos.

## Checklist

- [ ] `alert-confirmation.ts` criado com `MINIMUM_LIKES_TO_CONFIRM` nomeado
- [ ] Use case refatorado para 1 caminho de escrita
- [ ] `membershipRepository` removido (construtor + módulo)
- [ ] Parâmetros mortos removidos de `AlertReaction.create`
- [ ] Comportamento staff+DISLIKE confirmado com o time (ou corrigido)
- [ ] `alert-confirmation.spec.ts` cobrindo: staff, coringa, quórum, DISLIKE, abaixo do quórum
- [ ] `create-alert-reaction.spec.ts` atualizado e verde
