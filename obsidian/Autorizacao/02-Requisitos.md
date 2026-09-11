---
title: Requisitos - Autorização
tags:
  - authorization
  - requisitos
aliases:
  - Requisitos Autorização
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Requisitos

| | |
|---|---|
| **Domínio** | [[README\|Plataforma de Autorização]] |
| **Última atualização** | 2026-07-24 |

---

## 1. Requisitos Funcionais

| ID | Requisito | Estado | Referência |
|---|---|---|---|
| RF-01 | Rota pode exigir papel mínimo hierárquico e responder 403 antes do use case | ❌ desenhado (Task 15) | [[07-RBAC]] §2 |
| RF-02 | Rota sem exigência = qualquer autenticado (adoção incremental) | — invariante | [[03-Regras-de-Negocio]] RN-004 |
| RF-03 | Usuário pode receber papéis do catálogo (além do papel hierárquico) que agregam permissões `recurso:ação` | 🎯 | [[07-RBAC]] §4 |
| RF-04 | Todo grant do catálogo carrega escopo: OWN, COMMUNITY ou ANY | 🎯 | [[09-Ownership]] |
| RF-05 | Decisão contextual (estado do recurso, relação ator↔recurso) via policies de domínio | ✅ padrão existe; padronizar | [[08-Policies]] |
| RF-06 | Ponto único de decisão `can(actor, action, resource?)` consumível por guard, use case e API | 🎯 | [[10-CASL-ou-Estrategia]] |
| RF-07 | API de administração: CRUD de roles do catálogo, atribuição/revogação, consulta de permissões efetivas | 🎯 | [[11-API]] |
| RF-08 | `GET /me/abilities` — frontend consulta o que o usuário pode, sem duplicar regra no cliente | 🎯 | [[11-API]] §3 |
| RF-09 | Revogação de papel/permissão tem efeito na próxima requisição (≤1 request de janela) | 🎯 | [[13-Cache]], RN-007 |
| RF-10 | Toda concessão/revogação auditada: quem, quando, o quê, motivo, origem | 🎯 | [[14-Auditoria]] |
| RF-11 | Papéis vindos de provider externo (perfis SCPA) mapeiam para papéis do catálogo sem tocar o motor | 🎯 fase 10 da Identidade | [[07-RBAC]] §5 |
| RF-12 | Permissões efetivas exportáveis por usuário (revisão de acesso / auditoria externa) | 🎯 | [[11-API]] §4 |

## 2. Requisitos Não Funcionais

| ID | Requisito | Fundamento |
|---|---|---|
| RNF-01 | **Fail-closed**: qualquer falha do motor nega acesso | OWASP ASVS V8.1 |
| RNF-02 | Decisão da camada 1 sem I/O (dado já na sessão) | — |
| RNF-03 | Decisão da camada 2 com cache: P99 ≤ 5ms (hit) / ≤ 20ms (miss, 1 query) | [[13-Cache]] |
| RNF-04 | Invalidação de cache **síncrona** no evento de mudança de grant — staleness de TTL nunca se aplica a revogação | mesma disciplina do ADR-012 da Identidade |
| RNF-05 | 401 × 403 jamais trocados (não autenticado × sem permissão) | ASVS V8; já regra da Identidade |
| RNF-06 | Policies 100% puras — sem I/O, sem HTTP, sem framework | Clean Architecture ([[Geral]] §3) |
| RNF-07 | Adição de recurso/ação nova sem migração de dados (catálogo semeado por código versionado) | [[06-Modelo-de-Dados]] §3 |
| RNF-08 | Nenhuma resposta de erro revela a permissão que faltou em detalhe explorável (mensagem genérica ao cliente; detalhe só no log/auditoria) | ASVS V8.3 |
| RNF-09 | Mudanças administrativas de autorização exigem papel máximo (ROOT) ou permissão dedicada `authorization:manage` | Least Privilege, [[15-Seguranca]] |

## 3. Rastreio OWASP ASVS V8 (Authorization)

| Item ASVS | Cobertura |
|---|---|
| V8.1 — decisões documentadas, deny by default, least privilege | [[01-Visao-Geral]] §2, [[03-Regras-de-Negocio]] |
| V8.2 — enforcement no servidor, por operação | Camadas 1-3; frontend só consome `/me/abilities`, nunca decide |
| V8.3 — controle contextual (ownership, estado) | [[08-Policies]], [[09-Ownership]] |
| V8.4 — trilha de mudanças de acesso | [[14-Auditoria]] |

## Ver também

- [[README]] — índice
- [[03-Regras-de-Negocio]]
- [[15-Seguranca]]
