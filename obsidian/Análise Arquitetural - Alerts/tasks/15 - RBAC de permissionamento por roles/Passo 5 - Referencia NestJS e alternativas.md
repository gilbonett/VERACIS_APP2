---
title: Passo 5 - Referência NestJS e alternativas
tags:
  - rbac
  - nestjs
  - reference
---

#rbac #nestjs #reference

# Passo 5 — Referência: doc oficial NestJS e alternativas avaliadas

> Task pai: [[15 - RBAC de permissionamento por roles]] · Fonte: [NestJS — Authorization](https://docs.nestjs.com/security/authorization)

## O que a doc oficial propõe (RBAC básico)

Decorator com **lista** de roles + guard com `some`:

```ts
// doc oficial
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
```

O que **aproveitamos** dela no [[Passo 2 - MinRole decorator e RolesGuard|Passo 2]]:
- `SetMetadata` + `Reflector.getAllAndOverride` (handler sobrescreve classe) — idêntico.
- Registro via `APP_GUARD` — idêntico (já é o padrão do `SessionGuard` do projeto).

O que **mudamos** e por quê:

| Doc oficial | Nosso desenho | Motivo |
|---|---|---|
| `@Roles(Role.Admin)` — lista + `some` | `@MinRole("MANAGER")` — patamar + ranking | Nossos 4 roles são estritamente hierárquicos; lista obriga enumerar `ROOT` em toda rota e permite esquecê-lo (403 indevido para ROOT = bug silencioso) |
| Retorna `false` (403 genérico do Nest) | `throw new ForbiddenException("Permissão insuficiente.")` | Mensagem controlada + integra com `@ObserveGuard` (telemetria de denied já existente) |
| `user.roles` (array no request) | `session.currentUserRole` (singular, populado pelo `SessionGuard`) | Modelo do projeto: 1 role global por usuário |

## Claims-based (doc, seção 2)

Mesma mecânica trocando roles por **permissions** (`@RequirePermissions(...)`). Não adotado: exigiria inventar um vocabulário de permissões para um sistema cuja regra real é "staff pode, membro não pode" + regras contextuais que já vivem nas policies de domínio. Vocabulário de permissão sem matriz real = burocracia.

## CASL (doc, seção 3) — avaliado e **não adotado agora**

A doc mostra `@casl/ability`: `CaslAbilityFactory` monta habilidades por usuário (`can(Action.Update, Article, { authorId: user.id })`), `PoliciesGuard` + `@CheckPolicies` avaliam na borda.

**Por que não (hoje):**

1. **As regras contextuais do projeto já têm casa**: policies puras de domínio (`canViewHealthAlert`, futura `canManageCommunity`) — testáveis sem framework, sem dependência, e rodam **dentro do use case** (valem também para workers/filas, não só HTTP). CASL moveria essas regras para a borda, enfraquecendo o domínio — direção oposta à da arquitetura do projeto.
2. **Custo**: dependência nova + conceitos (Ability, Subject inference, detectSubjectType) para expressar o que `roleAtLeast` + 3 funções puras já expressam.
3. **Condições sobre o recurso na borda** (`{ authorId: user.id }`) exigem carregar o recurso **antes** do guard — inverte o fluxo atual (use case carrega e valida).

**Gatilho para reavaliar**: permissões configuráveis em runtime (por tenant/comunidade), matriz permissão×recurso com mais de ~6 roles, ou necessidade de o **frontend** consultar habilidades (CASL serializa abilities para o client — aí ele paga o custo).

## Decisão registrada

RBAC hierárquico mínimo na borda (`@MinRole` + `RolesGuard`) + policies puras no domínio. Sem CASL, sem claims, sem matriz em banco — até gatilho acima disparar.
