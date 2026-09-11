---
title: Task 15 - RBAC de permissionamento por roles
tags:
  - rbac
  - auth
  - clean-architecture
  - task
severidade: Média
esforco: Médio
fase: especial
status: pendente
---

#rbac #auth #clean-architecture #task

# Task 15 — RBAC de permissionamento por roles

> TODO geral: [[00 - TODO Geral]] · Referência oficial: [NestJS — Authorization](https://docs.nestjs.com/security/authorization) (resumo adaptado em [[Passo 5 - Referencia NestJS e alternativas]])

## Diagnóstico da codebase (2026-07-24)

**Já existe:**
- `UserRole = "MEMBER" | "LEADER" | "MANAGER" | "ROOT"` — global no `User` (`domain/users/entities/user.ts:10`), enum Prisma com `@default(MEMBER)`.
- `SessionGuard` global (`APP_GUARD` em `infra/auth/auth.module.ts`) — autentica cookie+HMAC e popula `req.session = { sessionId, userId, currentUserRole }`.
- `@Public()` para rotas abertas; `@CurrentSession()` entrega a sessão ao controller.

**Não existe:**
- Nenhuma autorização na borda: zero `@Roles`/`RolesGuard`, zero `ForbiddenException` em controllers/use cases.
- Checks de role ad-hoc no domínio: `currentUserRole !== "MEMBER"` (`alert.ts:215`, `create-alert-reaction.ts:84`), `MANAGER || ROOT` duplicado em `health-alert-visibility.ts:28-34`.
- `Membership` (user↔community) **sem role** — LEADER é global, não "líder da comunidade X".

## Arquitetura da solução — 2 camadas

> [!important] Regra de ouro
> **Guard decide "pode entrar na rota"** (coarse-grained, por role). **Domínio decide "pode agir sobre ESTE recurso"** (fine-grained, por dono/comunidade/status — as policies puras que já existem). Guard não conhece recurso; policy não conhece HTTP.

```
Request
  → SessionGuard   autentica, popula session            [infra, existente]
  → RolesGuard     RBAC coarse: role mínima da rota     [infra, NOVO]
  → Controller → Use Case
                  → policies puras (canViewHealthAlert…) [domínio, existente]
```

Divergência deliberada da doc do NestJS: a doc usa `@Roles(Role.Admin)` com **lista** + `some(...)`. Aqui os 4 roles são **estritamente hierárquicos** (ROOT ⊃ MANAGER ⊃ LEADER ⊃ MEMBER) → decorator `@MinRole("MANAGER")` com ranking. Lista obrigaria enumerar `ROOT` em toda rota e permite esquecê-lo (bug clássico). Justificativa completa e alternativas (CASL) em [[Passo 5 - Referencia NestJS e alternativas]].

## Passos de implementação (uma nota por passo)

1. [[Passo 1 - Shared kernel user-role]] — tipo + hierarquia em `core/auth/` (~30 min)
2. [[Passo 2 - MinRole decorator e RolesGuard]] — borda declarativa (~2h)
3. [[Passo 3 - Refatorar checks de dominio para isStaff]] — matar duplicação `MANAGER || ROOT` (~1h)
4. [[Passo 4 - Decisao role por comunidade]] — decisão de produto + desenho da evolução
5. [[Passo 5 - Referencia NestJS e alternativas]] — doc oficial adaptada + por que não CASL agora

## Resultado esperado (task completa)

- Qualquer rota pode declarar `@MinRole("LEADER" | "MANAGER" | "ROOT")` e responder **403** antes do use case.
- Rota sem `@MinRole` = qualquer autenticado (comportamento atual preservado — adoção incremental, sem big-bang).
- Zero comparação literal de role fora de `core/auth/user-role.ts`.
- Decisão sobre role por comunidade registrada (mesmo que "não por agora").

## Checklist geral

- [ ] [[Passo 1 - Shared kernel user-role|Passo 1]] — `core/auth/user-role.ts` + re-export
- [ ] [[Passo 2 - MinRole decorator e RolesGuard|Passo 2]] — decorator + guard + registro + spec
- [ ] [[Passo 3 - Refatorar checks de dominio para isStaff|Passo 3]] — 4 call sites refatorados
- [ ] Mapear com produto quais rotas são staff-only e anotar `@MinRole`
- [ ] [[Passo 4 - Decisao role por comunidade|Passo 4]] — decisão registrada
- [ ] Swagger: respostas 403 documentadas nas rotas anotadas
- [ ] Suite completa verde

> [!warning] Dependências
> Passo 1 substitui parte da [[12 - Lint de camadas e shared kernel UserRole|Task 12]] (`UserRole` no shared kernel) — se a 12 já tiver sido feita, pular a criação do tipo e só adicionar o ranking. Passo 3 toca os mesmos arquivos das tasks [[04 - Extrair politica de confirmacao de reacao|04]] e [[11 - Unificar definicao de alerta de saude|11]] — coordenar ordem.
