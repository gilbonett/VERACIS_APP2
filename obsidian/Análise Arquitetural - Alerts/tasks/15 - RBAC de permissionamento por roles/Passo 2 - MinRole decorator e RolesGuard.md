---
title: Passo 2 - MinRole decorator e RolesGuard
tags:
  - rbac
  - auth
  - nestjs
  - task
status: pendente
---

#rbac #auth #nestjs #task

# Passo 2 — `@MinRole` + `RolesGuard` (borda declarativa)

> Task pai: [[15 - RBAC de permissionamento por roles]] · Anterior: [[Passo 1 - Shared kernel user-role]] · Padrão base: [NestJS docs](https://docs.nestjs.com/security/authorization) adaptado em [[Passo 5 - Referencia NestJS e alternativas]]

## O que fazer

Criar o mecanismo declarativo de RBAC na borda HTTP: decorator `@MinRole(role)` define a role mínima da rota; `RolesGuard` global compara com `session.currentUserRole` usando a hierarquia e responde **403** antes de chegar ao use case.

## Como fazer

### 2.1 Decorator

`apps/api/src/infra/http/decorators/roles.decorator.ts`:

```ts
import { UserRole } from "@/core/auth/user-role";
import { SetMetadata } from "@nestjs/common";

export const MIN_ROLE_KEY = "minRole";

/**
 * Role mínima para acessar a rota (hierarquia ROOT > MANAGER > LEADER > MEMBER).
 * Sem @MinRole = qualquer usuário autenticado.
 * Aplicável no handler ou na classe (handler sobrescreve classe).
 */
export const MinRole = (role: UserRole) => SetMetadata(MIN_ROLE_KEY, role);
```

### 2.2 Guard

`apps/api/src/infra/http/guards/roles.guard.ts`:

```ts
import { roleAtLeast, UserRole } from "@/core/auth/user-role";
import { ObserveGuard } from "@/infra/telemetry/decorators/observe-guard.decorator";
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { MIN_ROLE_KEY } from "../decorators/roles.decorator";
import { AuthenticatedRequest } from "./session-guard";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  @ObserveGuard({ name: RolesGuard.name })
  canActivate(ctx: ExecutionContext): boolean {
    const minRole = this.reflector.getAllAndOverride<UserRole | undefined>(
      MIN_ROLE_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );

    if (!minRole) return true; // rota sem exigência de role

    const { session } = ctx.switchToHttp().getRequest<AuthenticatedRequest>();

    // rota @Public: SessionGuard não populou session — @MinRole não se aplica
    if (!session) return true;

    if (!roleAtLeast(session.currentUserRole, minRole)) {
      throw new ForbiddenException("Permissão insuficiente.");
    }

    return true;
  }
}
```

Detalhes que importam:

- **`getAllAndOverride`** (mesmo padrão do `IS_PUBLIC_KEY` no `SessionGuard`): handler tem precedência sobre classe → `@MinRole("MANAGER")` na classe + `@MinRole("LEADER")` num handler específico funciona.
- **`ForbiddenException` (403)**, não `UnauthorizedException` (401): usuário está autenticado, só não tem patamar. O `@ObserveGuard` existente já registra 403 como `denied` (ver `observe-guard.decorator.ts:66`).
- **`if (!session) return true`**: combinação `@Public()` + `@MinRole()` na mesma rota não faz sentido; guard não explode, ignora. Alternativa mais rígida (lançar erro de configuração no boot) é overkill agora.

### 2.3 Registro global — ordem importa

`apps/api/src/infra/auth/auth.module.ts`:

```ts
providers: [
  ValidateSessionUseCase,
  { provide: APP_GUARD, useClass: SessionGuard }, // 1º: autentica
  { provide: APP_GUARD, useClass: RolesGuard },   // 2º: autoriza
],
```

`APP_GUARD` executa na ordem de registro no provider array — `RolesGuard` **depois** do `SessionGuard`, senão lê `session` indefinida em rota protegida.

### 2.4 Uso + Swagger

```ts
@Controller("communities")
export class CreateCommunityController {
  @Post()
  @MinRole("MANAGER")
  @ApiForbiddenResponse({ description: "Requer role MANAGER ou superior." })
  async handle(...) {}
}
```

Padrão do projeto usa docs compostos (`@CreateAlertDoc()` etc.) — adicionar o `ApiForbiddenResponse` dentro do doc composto da rota anotada.

### 2.4.1 Semântica: patamar mínimo, não role única

`@MinRole` libera a role indicada **e todas acima** — não é "somente essa role":

| Anotação              | Quem passa                                            |
| --------------------- | ----------------------------------------------------- |
| *(sem anotação)*      | MEMBER, LEADER, MANAGER, ROOT (qualquer autenticado)  |
| `@MinRole("MEMBER")`  | MEMBER, LEADER, MANAGER, ROOT (equivale a não anotar) |
| `@MinRole("LEADER")`  | LEADER, MANAGER, ROOT                                 |
| `@MinRole("MANAGER")` | MANAGER, ROOT                                         |
| `@MinRole("ROOT")`    | só ROOT                                               |

> [!tip] Exemplo concreto: criar alerta
> "MEMBER, LEADER e MANAGER podem criar alerta" = **rota sem anotação** (ou `@MinRole("MEMBER")`, redundante). Todos os conjuntos de roles do domínio atual são contíguos na hierarquia — `@MinRole` cobre 100% dos casos.

> [!warning] Único caso que `@MinRole` não expressa
> Conjunto **não-contíguo** (ex.: MEMBER e MANAGER podem, LEADER não). Não existe no domínio hoje. Se surgir, criar escape hatch `@AllowRoles(...roles: UserRole[])` com lista + `includes` (o padrão da doc oficial do NestJS), convivendo com `@MinRole` — o guard checa os dois metadados. **Não criar antes de existir o caso** — decorator sem uso é código morto.

### 2.5 Spec do guard

`roles.guard.spec.ts` — casos mínimos:

| Cenário | Esperado |
|---|---|
| Rota sem `@MinRole` | passa |
| `@MinRole("LEADER")` + session MEMBER | `ForbiddenException` |
| `@MinRole("LEADER")` + session LEADER | passa |
| `@MinRole("LEADER")` + session ROOT | passa (hierarquia) |
| `@MinRole` na classe, handler sem | usa o da classe |
| Rota `@Public` (sem session) + `@MinRole` | passa (não explode) |

Mock: `Reflector` stub + `ExecutionContext` fake com `switchToHttp().getRequest()` — mesmo estilo de spec de guard usado no Nest.

## Resultado esperado

- Rota anotada devolve 403 para role insuficiente **sem executar o use case**.
- Rotas não anotadas: comportamento idêntico ao atual.
- 403 visível na telemetria de guards e no Swagger das rotas anotadas.

## Checklist

- [ ] `roles.decorator.ts` criado
- [ ] `roles.guard.ts` criado com hierarquia + `getAllAndOverride`
- [ ] Registro no `auth.module.ts` na ordem correta (Session → Roles)
- [ ] `roles.guard.spec.ts` com os 6 cenários verde
- [ ] `ApiForbiddenResponse` no(s) doc(s) compostos das rotas anotadas
- [ ] Teste manual: MEMBER numa rota `@MinRole("MANAGER")` → 403; MANAGER → 2xx
