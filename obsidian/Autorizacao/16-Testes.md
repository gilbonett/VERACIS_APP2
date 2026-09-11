---
title: Testes - Autorização
tags:
  - authorization
  - testes
aliases:
  - Testes Autorização
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Estratégia de Testes

| | |
|---|---|
| **Domínio** | [[README\|Plataforma de Autorização]] |
| **Última atualização** | 2026-07-24 |

---

Extensão da estratégia da plataforma ([[Autenticacao/20-Testes|Testes da Identidade]]) — mesmo padrão ✅ (specs puras, use cases com repositórios in-memory, guards com spec dedicada).

## 1. Unitários

| Alvo | Casos |
|---|---|
| Hierarquia (`roleAtLeast`) | Tabela completa 4×4 patamares |
| `RolesGuard` | Os 6 cenários da Task 15 (sem anotação, insuficiente, exato, superior, classe×handler, @Public) |
| Resolução de escopo | OWN/COMMUNITY/ANY × recurso com/sem `ownerId`/`communityId` (fail-closed nos nulos) |
| Policies | Tabela de casos por policy — **policy sem spec não entra no registro** ([[08-Policies]] §5) |
| Piso→grants implícitos | Fixture da tabela de [[07-RBAC]] §3 — mudança na tabela quebra o teste (proteção contra drift silencioso) |
| Naming do catálogo | Toda permissão semeada valida contra `RESOURCES` — string órfã falha o build/seed |

## 2. Integração

| Alvo | Casos |
|---|---|
| `AbilityService` | União piso+catálogo; grant sem policy; grant com policy negando; escopos múltiplos (maior vence); ator sem nada (deny) |
| Atribuição | Conceder→`can` reflete na próxima chamada; revogar→idem (RN-006); auto-atribuição rejeitada; mutação sem `reason` rejeitada |
| Cache | Hit/miss; invalidação síncrona pós-mudança; fallback com Redis fora; `RolePermissionsChanged` invalidando N usuários |

## 3. Corrida (obrigatórios)

- Revogação × `can` concorrente: nenhuma decisão positiva após a revogação retornar (janela = 0 na via síncrona).
- Duas concessões simultâneas do mesmo papel: idempotência (constraint única de assignment ativo).

## 4. Testes de Segurança (CI, sempre)

| Caso | Verifica |
|---|---|
| **Inventário de rotas** | Lista automatizada de rotas mutáveis sem `@MinRole`/`@RequirePermission` — diff revisado em PR (mitiga RN-004) |
| Escalação | MEMBER tentando cada endpoint administrativo de [[11-API]] ⇒ 403 + auditoria |
| Mass assignment | `role`/assignments em payloads de perfil ⇒ ignorado/rejeitado |
| 401×403 | Matriz: sem sessão / com sessão sem permissão, por grupo de rotas |
| Vazamento | Corpo do 403 não revela permissão faltante |
| Ownership | Editar recurso de outro com grant OWN ⇒ 403; o próprio ⇒ 200 |

## 5. Performance

Benchmark do `can()` com PermissionSet em cache (alvo P99 ≤5ms, RNF-03) e do miss (1 query, ≤20ms) — rodado em CI de performance (k6 já existe no repo ✅ — reutilizar harness).

## Ver também

- [[README]] — índice
- [[Autenticacao/20-Testes|Testes da Identidade]]
- [[19-Tasks]] — DoD referencia esta matriz
