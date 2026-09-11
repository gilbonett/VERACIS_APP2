---
title: Gap Analysis - Autorização
tags:
  - authorization
  - gap-analysis
  - rbac
aliases:
  - Gap Analysis Autorização
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Gap Analysis — Permissionamento Atual vs. Proposto

| | |
|---|---|
| **Domínio** | [[README\|Plataforma de Autorização]] |
| **Base** | Leitura direta de `apps/api` (2026-07-24) + diagnóstico prévio da Task 15 |
| **Última atualização** | 2026-07-24 |

---

## 1. Como Funciona Hoje — ✅ Confirmado

1. **Papel global único**: `UserRole = MEMBER | LEADER | MANAGER | ROOT` no `User` (enum Prisma, `@default(MEMBER)`), hierarquia implícita e estritamente contígua.
2. **Sessão carrega o papel**: `SessionGuard` popula `req.session = { sessionId, userId, currentUserRole }` (`session-guard.ts:71-75`) — a informação certa já chega ao lugar certo.
3. **Zero autorização de borda**: nenhum `RolesGuard`, nenhum `@Roles`, nenhuma `ForbiddenException` sistemática em controllers. Toda rota autenticada é acessível a qualquer papel.
4. **Checks ad-hoc no domínio**: comparações literais espalhadas — `currentUserRole !== "MEMBER"` (`alert.ts:215`, `create-alert-reaction.ts:84`), `MANAGER || ROOT` duplicado em `health-alert-visibility.ts:28-34`.
5. **Policies puras existem** (ponto forte): `filterAlertsByHealthVisibility` e afins — funções de domínio sem HTTP, testáveis. É ABAC de facto onde o contexto importa.
6. **`Membership` sem papel**: vínculo user↔comunidade é só a PK composta — "LEADER" é líder de **tudo**, não de uma comunidade específica (decisão de produto pendente, Task 15 Passo 4).

## 2. Problemas, Riscos e Limitações

| # | Problema | Evidência | Risco |
|---|---|---|---|
| 1 | **Broken Access Control por omissão** — rota staff sem proteção de papel | Zero guard de role no projeto ✅ | 🔴 OWASP Top 10 A01: qualquer autenticado alcança qualquer endpoint; a proteção real depende de cada use case lembrar de checar |
| 2 | Comparações literais de papel duplicadas | 4+ call sites com strings `"MEMBER"`/`"MANAGER"` | 🟠 Papel novo ou mudança de hierarquia exige caçar strings; inconsistência silenciosa |
| 3 | Regra de papel dentro de entidade de domínio | `alert.ts:215` decide por papel dentro do aggregate | 🟠 Violação de camada — entidade conhece política de acesso; dificulta teste e reuso (já apontado na Task 15) |
| 4 | Sem conceito de permissão — só papel | — | 🟡 Composições não-hierárquicas ("aceita alerta mas não bloqueia usuário") inexpressáveis; mapeamento futuro para perfis SCPA sem ponte |
| 5 | Sem ownership formal | Nenhum check "é o dono?" sistematizado (perfil usa `session.userId` implicitamente) | 🟡 Cada use case novo reinventa (ou esquece) a regra de dono |
| 6 | Sem auditoria de mudança de papel | `role` alterável sem trilha | 🟠 "Quem virou MANAGER e quem concedeu?" — sem resposta |
| 7 | Sem invalidação de permissão em sessão viva | Papel na sessão vem do `ValidateSessionUseCase` a cada request (lê o User) — mudanças de papel **já surtem efeito** ✅, mas isso depende do cache de User (`users:{id}` no Redis) ser invalidado no `save` | 🟡 Janela de staleness do cache de usuário se a invalidação falhar — herdado, documentar |

## 3. Pontos Fortes e Componentes Reaproveitáveis

| Componente ✅ | Reuso na plataforma |
|---|---|
| Policies puras de domínio | Viram a **camada 3** do motor de decisão, sem mudança de padrão — só padronização de assinatura ([[08-Policies]]) |
| `SessionGuard` + `AuthSession` | Fonte da identidade para toda decisão; ganha `permissions`/`scopes` resolvidos quando a camada 2 ativar |
| Desenho da Task 15 (`@MinRole` + `RolesGuard`) | **Camada 1 pronta para implementar** — spec completa com testes; nada a redesenhar |
| Padrão Either + use cases testáveis | Toda decisão de autorização testável sem HTTP |
| Domain events + BullMQ | Canal de invalidação de cache e auditoria ([[12-Eventos]], [[13-Cache]]) |
| Cache Redis padrão (`users:{id}`) | Template do cache de `PermissionSet` ([[13-Cache]]) |
| Enum hierárquico | Permanece como piso da camada 1 — nunca é migrado destrutivamente |

## 4. Arquitetura Atual vs. Proposta — Resumo

| Dimensão | Hoje | Proposto |
|---|---|---|
| Borda HTTP | Nada | Camada 1: `@MinRole` hierárquico (Task 15) — 403 antes do use case |
| Permissão fina | Inexistente | Camada 2: catálogo `recurso:ação` + escopo de grant (OWN/COMMUNITY/ANY), aditivo sobre o piso da hierarquia |
| Contexto/relacionamento | Policies ad-hoc (boas, mas sem padrão único) | Camada 3: policies padronizadas, registradas, com fluxo de teste próprio |
| Ownership | Implícito e pontual | Formalizado como escopo de grant + helper de policy ([[09-Ownership]]) |
| Organização | Comunidade sem papel | Escopo COMMUNITY no grant — destrava a decisão da Task 15 Passo 4 sem migrar o enum |
| Decisão | Espalhada | `AbilityService` único: `can(actor, action, resource?)` ([[10-CASL-ou-Estrategia]]) |
| Cache | N/A | `PermissionSet` por usuário em Redis, invalidação por evento ([[13-Cache]]) |
| Auditoria | Nenhuma | Eventos de autorização na trilha única da plataforma ([[14-Auditoria]]) |
| Negação | N/A | **Grant-only, deny por padrão** — sem permissões negativas (ADR-AZ-02) |

## 5. Estratégia de Migração (sem big-bang)

1. Camada 1 primeiro (Task 15, passos 1-3) — zero tabela nova, adoção incremental por rota.
2. Refatorar os 4+ call sites literais para `isStaff`/policies (Task 15 passo 3) — mata a duplicação antes de qualquer tabela.
3. Schema do catálogo criado **sem uso obrigatório** (mesma tática do IDP-020) — rotas migram para permissão fina só onde a hierarquia não expressa.
4. Ownership/escopos entram com o primeiro caso real de produto (edição de comentário próprio é o candidato natural).
5. Cache e auditoria acompanham a ativação da camada 2 — não antes (nada a cachear/auditar sem grants).

## Ver também

- [[README]] — índice
- [[04-Arquitetura]] — o motor em 3 camadas
- [[18-Roadmap]] · [[19-Tasks]]
