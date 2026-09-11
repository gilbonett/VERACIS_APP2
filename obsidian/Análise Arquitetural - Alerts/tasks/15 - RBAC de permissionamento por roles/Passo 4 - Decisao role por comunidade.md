---
title: Passo 4 - Decisão role por comunidade
tags:
  - rbac
  - ddd
  - decisao
  - task
status: pendente
---

#rbac #ddd #task

# Passo 4 — Decisão: role global vs role por comunidade

> Task pai: [[15 - RBAC de permissionamento por roles]] · **Decisão de produto**, não de código — registrar antes de evoluir.

## O problema

Modelo atual: `role` mora no `User`; `Membership` (user↔community, `domain/users/entities/membership.ts`) só tem `userId` + `communityId`. Consequência: **LEADER é líder de tudo** — não existe "líder DA comunidade X".

Se a regra de negócio real for liderança escopada por comunidade, o RBAC de borda ([[Passo 2 - MinRole decorator e RolesGuard|Passo 2]]) não cobre — ele só sabe o patamar global. Pergunta para produto:

> Um LEADER da comunidade A pode moderar/aceitar alertas da comunidade B?

## Cenário A — role global basta (nada a fazer)

Se sim (staff é global), o desenho atual está correto. Registrar a decisão aqui e em `Regras-de-Negocio/Usuarios` e encerrar o passo.

## Cenário B — role por comunidade (evolução desenhada)

O `@MinRole` continua como está (patamar global = "é staff em algum grau"). O escopo entra como **policy de domínio**, não como guard:

1. **Migration**: coluna `role` na tabela de membership (`@default(MEMBER)`), backfill: membros de comunidade onde o user global é LEADER recebem LEADER local (validar regra de backfill com produto).

2. **Entidade**: `MembershipProps` ganha `role: UserRole`; `Membership.create/reconstitute` atualizados; mapper Prisma idem.

3. **Policy de domínio** (`domain/users/policies/community-management.ts`):

```ts
import { roleAtLeast, UserRole } from "@/core/auth/user-role";

type MembershipView = { communityId: string; role: UserRole };

export function canManageCommunity(
  globalRole: UserRole,
  memberships: MembershipView[],
  communityId: string,
): boolean {
  if (roleAtLeast(globalRole, "MANAGER")) return true; // MANAGER/ROOT gerem tudo

  const membership = memberships.find((m) => m.communityId === communityId);
  return membership ? roleAtLeast(membership.role, "LEADER") : false;
}
```

4. **Uso**: use cases que hoje fazem `isStaff(currentUserRole)` num contexto de comunidade específica (ex.: aceite de alerta) passam a chamar `canManageCommunity(...)` — o que exige carregar memberships na sessão ou no use case. Opção recomendada: incluir `memberships: { communityId, role }[]` no `AuthSession` (o `ValidateSessionUseCase` já carrega o user; custo marginal), evitando query extra por request.

> [!warning] Não implementar "por precaução"
> Cenário B adiciona migration, backfill, mudança de sessão e nova policy — custo real. Sem demanda de produto confirmada, ficar no Cenário A. O desenho acima existe para a evolução encaixar **sem retrabalho** no que os Passos 1–3 constroem (guard e hierarquia não mudam).

## Resultado esperado

- Decisão registrada (aqui + `Regras-de-Negocio/Usuarios`), com data e responsável.
- Se Cenário B aprovado: task de implementação própria criada com os 4 itens acima.

## Checklist

- [ ] Pergunta levada a produto ("LEADER modera comunidade que não é dele?")
- [ ] Decisão registrada nesta nota (editar abaixo)
- [ ] `Regras-de-Negocio/Usuarios` atualizada
- [ ] Se Cenário B: task de implementação criada (migration + entidade + policy + sessão)

## Decisão

> _(preencher)_ — Data: · Decidido por: · Cenário: A / B
