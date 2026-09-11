---
title: Passo 1 - Shared kernel user-role
tags:
  - rbac
  - auth
  - task
status: pendente
---

#rbac #auth #task

# Passo 1 — Shared kernel `user-role` (tipo + hierarquia)

> Task pai: [[15 - RBAC de permissionamento por roles]] · Próximo: [[Passo 2 - MinRole decorator e RolesGuard]]

## O que fazer

Hoje `UserRole` mora em `domain/users/entities/user.ts` e é importado por 6+ arquivos do Alerts (+ guards da infra) — shared kernel implícito. Formalizar em `core/auth/` e adicionar o **ranking hierárquico**, que é a base de todo o RBAC.

## Como fazer

1. Criar `apps/api/src/core/auth/user-role.ts`:

```ts
export const USER_ROLES = ["MEMBER", "LEADER", "MANAGER", "ROOT"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/**
 * Hierarquia estrita: cada role herda as permissões das inferiores.
 * ROOT > MANAGER > LEADER > MEMBER
 */
const ROLE_RANK: Record<UserRole, number> = {
  MEMBER: 0,
  LEADER: 1,
  MANAGER: 2,
  ROOT: 3,
};

/** `role` tem pelo menos o patamar de `minimum`? */
export function roleAtLeast(role: UserRole, minimum: UserRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

/** Staff = LEADER pra cima (modera alertas, vê alertas de saúde etc.). */
export function isStaff(role: UserRole): boolean {
  return roleAtLeast(role, "LEADER");
}
```

2. Compatibilidade — `domain/users/entities/user.ts` passa a re-exportar (nenhum import quebra):

```ts
// no topo do user.ts, substituindo a definição local:
export type { UserRole } from "@/core/auth/user-role";
import type { UserRole } from "@/core/auth/user-role";
```

3. **Não** migrar os call sites em massa agora — o re-export mantém tudo funcionando. Migração de import acontece naturalmente ao tocar cada arquivo (Passos 2 e 3 já usam o caminho novo).

4. Spec `core/auth/user-role.spec.ts` — a hierarquia é regra de negócio central, merece teste explícito:

```ts
describe("roleAtLeast", () => {
  it("ROOT passa em qualquer patamar", () => {
    expect(roleAtLeast("ROOT", "MEMBER")).toBe(true);
    expect(roleAtLeast("ROOT", "ROOT")).toBe(true);
  });

  it("MEMBER só passa no próprio patamar", () => {
    expect(roleAtLeast("MEMBER", "MEMBER")).toBe(true);
    expect(roleAtLeast("MEMBER", "LEADER")).toBe(false);
  });

  it("isStaff: LEADER sim, MEMBER não", () => {
    expect(isStaff("LEADER")).toBe(true);
    expect(isStaff("MEMBER")).toBe(false);
  });
});
```

> [!warning] Sincronia com o enum Prisma
> O enum `UserRole` do Prisma (`prisma/models/user.prisma:53`) é a fonte no banco. Os valores do array `USER_ROLES` devem bater 1:1 — se um role novo entrar no Prisma, o `Record<UserRole, number>` quebra em compile time (bom: erro visível). Deixar comentário no `.prisma` apontando para `core/auth/user-role.ts`.

## Resultado esperado

- `core/auth/user-role.ts` como única definição de role + hierarquia.
- Nenhum import quebrado (re-export ativo).
- Spec da hierarquia verde.

## Checklist

- [ ] `core/auth/user-role.ts` criado (type + `USER_ROLES` + `roleAtLeast` + `isStaff`)
- [ ] `user.ts` re-exportando do core
- [ ] Comentário de sincronia no `user.prisma`
- [ ] `user-role.spec.ts` verde
- [ ] Build completo verde (nenhum import quebrado)
