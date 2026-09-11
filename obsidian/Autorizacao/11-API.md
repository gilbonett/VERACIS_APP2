---
title: API - Autorização
tags:
  - authorization
  - api
aliases:
  - API Autorização
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# API

| | |
|---|---|
| **Domínio** | [[README\|Plataforma de Autorização]] |
| **Última atualização** | 2026-07-24 |

---

Todos os endpoints 🎯. Convenções herdadas ✅: `Either`, docs Swagger compostos, 401×403 estritos, throttling.

## 1. Administração de Roles e Permissões — exige ROOT ou `authorization:manage`

| Endpoint | Método | Descrição |
|---|---|---|
| `/authz/permissions` | GET | Catálogo completo (leitura do seed — imutável via API) |
| `/authz/roles` | GET · POST | Listar / criar papel de catálogo |
| `/authz/roles/:id` | GET · PATCH · DELETE | Detalhe / editar / remover (`isSystem` = irremovível) |
| `/authz/roles/:id/permissions` | PUT | Define o conjunto de grants do papel (substituição atômica, auditada) |

## 2. Atribuição

| Endpoint | Método | Descrição |
|---|---|---|
| `/authz/users/:userId/roles` | GET | Atribuições ativas (e histórico com `?includeRevoked`) |
| `/authz/users/:userId/roles` | POST | Concede: `{ roleId, scope, communityId?, reason }` — `reason` obrigatório (RN-011); auto-atribuição rejeitada (RN-010) |
| `/authz/users/:userId/roles/:assignmentId` | DELETE | Revoga (soft — `revokedAt`); `reason` obrigatório; invalidação de cache síncrona (RN-006) |

## 3. Consulta de Abilities (consumo do frontend e de telas)

| Endpoint | Método | Auth | Descrição |
|---|---|---|---|
| `/me/abilities` | GET | Sessão | `AbilityProjection` do próprio usuário — o frontend decide o que **exibir**; o servidor continua decidindo o que **executar** (ASVS V8.2). Cacheável com o mesmo TTL do PermissionSet |
| `/authz/users/:userId/abilities` | GET | `authorization:read` | Permissões efetivas de terceiro — revisão de acesso |

## 4. Exportação e Sincronização

| Endpoint | Método | Descrição |
|---|---|---|
| `/authz/export` | GET | Snapshot completo (papéis, grants, atribuições ativas) para revisão de acesso periódica / auditoria externa — formato JSON estável |
| Sincronização de cache | — | **Não é endpoint** — invalidação é interna, por evento ([[13-Cache]] §3). Expor "invalidar cache" via API seria vetor de DoS e sintoma de desenho errado |

## 5. Erros

| Caso | Resposta |
|---|---|
| Sem sessão | 401 |
| Patamar/permissão insuficiente | 403 genérico ("Permissão insuficiente.") — detalhe só em log/auditoria (RNF-08) |
| Auto-atribuição | 403 + `SelfAssignmentError` (auditado) |
| Mutação sem `reason` | 400 (validação Zod, padrão do projeto ✅) |
| Papel `isSystem` em DELETE | 409 |

## Ver também

- [[README]] — índice
- [[12-Eventos]] · [[13-Cache]] · [[14-Auditoria]]
