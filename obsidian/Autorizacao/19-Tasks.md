---
title: Tasks - Autorização
tags:
  - authorization
  - tasks
  - backlog
aliases:
  - Backlog Autorização
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Backlog Executável

| | |
|---|---|
| **Domínio** | [[README\|Plataforma de Autorização]] |
| **Última atualização** | 2026-07-24 |

---

Prioridade 🔴/🟡/🟢. **DoD comum**: suite completa verde, matriz de [[16-Testes]] do nível coberto, docs desta pasta atualizadas se divergir, Swagger das rotas tocadas, sem warning novo de lint. Relação com o backlog da Identidade: **AUTHZ-001/002 executam o que lá está como IDP-021; AUTHZ-003 detalha o IDP-020** — marcar lá ao concluir aqui (uma execução, dois registros).

---

### AUTHZ-001 — Shared kernel + `@MinRole` + `RolesGuard` 🔴 · F1 · ~3d

**Objetivo**: camada 1 no ar (Task 15 passos 1-2, spec pronta). **Dependências**: nenhuma. **Aceite**: 6 cenários do guard verdes; registro após `SessionGuard`; rota anotada ⇒ 403 sem executar use case.
- [ ] `core/auth/user-role.ts` (tipo + `roleAtLeast`) — atenção à sobreposição com Task 12 dos Alerts (ver aviso na própria Task 15)
- [ ] Decorator + guard + registro ordenado no `AuthModule`
- [ ] `roles.guard.spec.ts` (6 cenários) · anotar rotas staff mapeadas com produto · `ApiForbiddenResponse` nos docs compostos

### AUTHZ-002 — Matar checks literais de papel 🔴 · F1 · ~2d

**Objetivo**: Task 15 passo 3 — zero string de papel fora do kernel. **Dependências**: AUTHZ-001. **Aceite**: grep por `"MEMBER"|"MANAGER"` etc. em domínio retorna só o kernel; comportamento inalterado (regressão).
- [ ] Refatorar `alert.ts:215`, `create-alert-reaction.ts:84`, `health-alert-visibility.ts:28-34` (+ grep completo) para `isStaff`/policies
- [ ] Registrar decisão do Passo 4 (papel por comunidade) com produto

### AUTHZ-003 — Migrations do catálogo + seed 🟡 · F2 · ~3d

**Objetivo**: [[06-Modelo-de-Dados]] na íntegra. **Dependências**: AUTHZ-001. **Aceite**: seed idempotente; `PermissionKey` fora do catálogo falha build; índices na mesma migration; nenhuma rota alterada.
- [ ] 4 tabelas + índices · módulo `RESOURCES` tipado · seed de permissões e papéis de sistema (`auditor`, `community-manager`)

### AUTHZ-004 — Validar tabela piso→grants com produto 🔴 · F3 · ~2d (workshop + fixture)

**Objetivo**: a tabela de [[07-RBAC]] §3 deixar de ser proposta. **Dependências**: AUTHZ-003. **Aceite**: tabela assinada por produto; fixture testada; divergências corrigidas na doc.
- [ ] Workshop linha a linha · fixture `role-floor.fixture.ts` + spec · atualizar [[07-RBAC]]

### AUTHZ-005 — `AbilityService` + `PermissionSetResolver` 🔴 · F3 · ~4d

**Objetivo**: motor único de decisão ([[10-CASL-ou-Estrategia]] §4-5). **Dependências**: AUTHZ-003/004. **Aceite**: matriz de integração de [[16-Testes]] §2 verde; união piso+catálogo; fail-closed em todo caminho de erro.
- [ ] Contrato + implementação · resolução de escopo (`Ownable`) · motivo de negação no log/telemetria (`AuthorizationDenied`)

### AUTHZ-006 — Contrato `Policy<T>` + migração das policies existentes 🟡 · F4 · ~2d

**Objetivo**: camada 3 padronizada sem mudar lógica. **Dependências**: AUTHZ-005. **Aceite**: regressão total verde; registro (resource,action)→policies no bootstrap; policy sem spec bloqueada em revisão.
- [ ] Contrato + registro · migrar `health-alert-visibility` e demais · specs por tabela de casos

### AUTHZ-007 — `PermissionGuard` + `@RequirePermission` 🟡 · F3 · ~1d

**Objetivo**: camada 2 na borda para rotas sem recurso. **Dependências**: AUTHZ-005. **Aceite**: rota anotada nega sem grant; convive com `@MinRole` (união — quem passa em qualquer um dos declarados? **Não**: ambos declarados = ambos exigidos, documentar no decorator).
- [ ] Guard fino delegando ao `AbilityService` · spec · exemplo em rota real

### AUTHZ-008 — Use cases de atribuição + API administrativa 🔴 · F3/F8 · ~4d

**Objetivo**: [[11-API]] §1-2. **Dependências**: AUTHZ-005. **Aceite**: `reason` obrigatório; auto-atribuição 403+auditada; `isSystem` protegido; RN-006 (efeito imediato) em teste de corrida.
- [ ] Conceder/revogar (soft) · CRUD de papéis · proteção `authorization:manage` · testes de escalação ([[16-Testes]] §4)

### AUTHZ-009 — Ownership: `Ownable` + primeiro caso real 🟡 · F5 · ~3d

**Objetivo**: [[09-Ownership]] §3 com caso de produto (editar o próprio comentário). **Dependências**: AUTHZ-005. **Aceite**: matriz OWN/COMMUNITY/ANY × recurso com/sem atributos verde; caso real em produção atrás da permissão.
- [ ] Interface nos recursos · resolução fail-closed · caso piloto + testes

### AUTHZ-010 — Cache de PermissionSet 🟡 · F6 · ~3d

**Objetivo**: [[13-Cache]] completo. **Dependências**: AUTHZ-005/008. **Aceite**: RN-006 em corrida; fallback Redis-fora; invalidação em lote no `RolePermissionsChanged`; métricas expostas.
- [ ] Read-through + DEL síncrono em todos os gatilhos · subscriber de `MembershipChanged` (coordenar evento com domínio User) · métricas

### AUTHZ-011 — Eventos → trilha de auditoria 🟡 · F7 · ~2d

**Objetivo**: [[14-Auditoria]] §2 na trilha da plataforma. **Dependências**: AUTHZ-008 + IDP-009 (trilha existir). **Aceite**: concessão/revogação consultável com `grantedBy`/`reason`; `AUTHORIZATION_ADMIN_DENIED` gravado.
- [ ] eventTypes novos no catálogo da trilha · subscribers · consulta de histórico

### AUTHZ-012 — `GET /me/abilities` + export 🟢 · F8 · ~2d

**Objetivo**: [[11-API]] §3-4. **Dependências**: AUTHZ-005. **Aceite**: projeção estável documentada p/ frontend; export completo para revisão de acesso.
- [ ] Endpoint + contrato versionado · `/authz/export` · doc de consumo p/ time de frontend

### AUTHZ-013 — Teste de inventário de rotas em CI 🔴 · F8 · ~1d

**Objetivo**: mitigação permanente da RN-004. **Dependências**: AUTHZ-001/007. **Aceite**: CI lista rotas mutáveis sem anotação; diff exige justificativa em PR.
- [ ] Coletor de metadata das rotas · snapshot test · doc do fluxo de exceção

### AUTHZ-014 — Mapeamento SCPA→catálogo 🔴 (estratégico) · F9 · ~3d + dependências externas

**Objetivo**: RN-012 na integração real. **Dependências**: AUTHZ-003; fase 10 da Identidade (IDP-019). **Aceite**: perfil SCPA vira `UserRoleAssignment` auditada com `grantedBy: provider:scpa`; perfil desconhecido ⇒ zero grant.
- [ ] Tabela de mapeamento versionada no provider · testes · homologação conjunta com IDP-019

## Ver também

- [[README]] — índice
- [[18-Roadmap]] · [[16-Testes]]
- [[Autenticacao/19-Tasks|Backlog da Identidade]] — IDP-020/021 são executados por AUTHZ-001/002/003
