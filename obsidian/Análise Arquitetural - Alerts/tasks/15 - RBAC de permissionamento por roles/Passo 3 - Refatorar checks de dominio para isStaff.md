---
title: Passo 3 - Refatorar checks de domínio para isStaff
tags:
  - rbac
  - ddd
  - refactor
  - task
status: pendente
---

#rbac #ddd #refactor #task

# Passo 3 — Refatorar checks de domínio para `isStaff`/`roleAtLeast`

> Task pai: [[15 - RBAC de permissionamento por roles]] · Anterior: [[Passo 2 - MinRole decorator e RolesGuard]]

## O que fazer

O RBAC de borda **não substitui** as regras de domínio que dependem de role — elas continuam nas policies/entidades (fine-grained, precisam do contexto do recurso). Este passo só elimina as comparações literais espalhadas, trocando por semântica nomeada do [[Passo 1 - Shared kernel user-role|shared kernel]].

## Call sites mapeados (grep de 2026-07-24)

| Arquivo | Hoje | Depois |
|---|---|---|
| `domain/alerts/policies/health-alert-visibility.ts:28-34` | `role === "LEADER"` … `role === "MANAGER" \|\| role === "ROOT"` (3 ifs) | `isStaff(currentUserRole)` (1 linha) |
| `domain/alerts/entities/alert.ts:215` | `data.currentUserRole !== "MEMBER"` | `isStaff(data.currentUserRole)` |
| `domain/alerts/use-cases/create-alert-reaction.ts:84` | `currentUserRole !== "MEMBER"` | `isStaff(currentUserRole)` — ou some, se a [[04 - Extrair politica de confirmacao de reacao|Task 04]] já extraiu a política |
| `domain/users/entities/user.ts:240` | `user.role === "MEMBER"` | avaliar semântica: é "não-staff" (`!isStaff`) ou literalmente MEMBER? Ler o contexto antes de trocar |

## Como fazer

1. Import do core em cada arquivo: `import { isStaff } from "@/core/auth/user-role";`
2. `canViewHealthAlertByRole` fica:

```ts
function canViewHealthAlertByRole(
  authorId: string,
  currentUserId: string,
  currentUserRole: UserRole,
): boolean {
  return authorId === currentUserId || isStaff(currentUserRole);
}
```

3. `user.ts:240`: **não trocar mecanicamente** — `role === "MEMBER"` e `!isStaff(role)` são equivalentes hoje, mas expressam intenções diferentes. Ler a regra, escolher a semântica certa, comentar se ambígua.
4. Rodar `health-alert-visibility.spec.ts` e `create-alert-reaction.spec.ts` — comportamento não pode mudar (refactor puro).
5. Guardrail final: grep de literal de role fora do core deve retornar ~zero:

```bash
grep -rn '=== "MEMBER"\|=== "LEADER"\|=== "MANAGER"\|=== "ROOT"\|!== "MEMBER"' \
  apps/api/src --include="*.ts" | grep -v dist | grep -v spec | grep -v core/auth
```

> [!tip] Coordenação com outras tasks
> - [[04 - Extrair politica de confirmacao de reacao|Task 04]] mexe em `create-alert-reaction.ts` — se ela vier primeiro, este passo só ajusta a política extraída.
> - [[11 - Unificar definicao de alerta de saude|Task 11]] mexe em `health-alert-visibility.ts` — mesma coisa. Fazer este passo antes ou junto; nunca em PR paralelo tocando o mesmo arquivo.

## Resultado esperado

- Nenhuma comparação literal de role fora de `core/auth/user-role.ts` (grep limpo).
- Zero mudança de comportamento (specs existentes verdes sem edição).

## Checklist

- [ ] `health-alert-visibility.ts` usando `isStaff`
- [ ] `alert.ts:215` usando `isStaff`
- [ ] `create-alert-reaction.ts:84` usando `isStaff` (ou política da Task 04)
- [ ] `user.ts:240` avaliado e ajustado com semântica correta
- [ ] Grep de literais limpo
- [ ] Specs existentes verdes sem modificação
