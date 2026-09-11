---
title: Auditoria - Autorização
tags:
  - authorization
  - audit
aliases:
  - Auditoria Autorização
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Auditoria

| | |
|---|---|
| **Domínio** | [[README\|Plataforma de Autorização]] |
| **Última atualização** | 2026-07-24 |

---

## 1. Uma Trilha, Não Duas (ADR-AZ-06)

A autorização **não cria** uma tabela `PermissionAudit` própria — seus eventos entram na trilha única da plataforma ([[Autenticacao/13-Auditoria|AuditLog]]: append-only, particionada, outbox, retenção LGPD). Duas trilhas = duas fontes de verdade, duas políticas de retenção, dois pontos de falha de imutabilidade. Consultas específicas de autorização ("histórico de concessões do usuário X") são **views/filtros** sobre a trilha única (`eventType` + `metadata`), mais o histórico estrutural que o próprio modelo guarda (`UserRoleAssignment` com soft-revoke ✅ por desenho — a atribuição nunca é apagada).

## 2. O Que Entra na Trilha

| `eventType` | Quando | `metadata` específico |
|---|---|---|
| `ROLE_CREATED` / `ROLE_UPDATED` / `ROLE_DELETED` | Administração do catálogo | `roleKey`, diff de campos |
| `ROLE_PERMISSIONS_CHANGED` | Mudança de grants de um papel | `roleKey`, `added[]`, `removed[]` |
| `USER_ROLE_ASSIGNED` | Concessão | `roleKey`, `scope`, `communityId?`, **`grantedBy`**, **`reason`** |
| `USER_ROLE_REMOVED` | Revogação | idem + `revokedBy`, `reason` |
| `AUTHORIZATION_ADMIN_DENIED` | Tentativa negada de operação administrativa (incl. auto-atribuição) | rota, alvo, motivo |

Todo registro carrega o padrão da trilha: ator, IP, dispositivo, `sessionId`, `correlationId`, `requestId`, timestamp, resultado — "quem concedeu, quem removeu, quando, motivo, origem" respondido integralmente.

## 3. O Que NÃO Entra (deliberado)

Negações comuns de runtime (`403` de usuário sem permissão numa tela) — vão para **métrica/log** (`AuthorizationDenied`, [[12-Eventos]] §2), não para a trilha. Racional: volume/ruído; a trilha responde "como o privilégio mudou", o log responde "o que foi tentado". Exceção: negações **administrativas** (§2, última linha) — essas são sinal de escalação tentada e entram.

## 4. Revisão de Acesso Periódica

`GET /authz/export` ([[11-API]] §4) + trilha = insumo para revisão periódica de acesso (quem tem o quê, desde quando, concedido por quem) — prática exigida em auditorias de sistemas governamentais. Recomendação operacional: revisão trimestral dos papéis ANY e do papel ROOT, registrada como evento `ACCESS_REVIEW_COMPLETED` (metadata: revisor, escopo, achados).

## Ver também

- [[README]] — índice
- [[Autenticacao/13-Auditoria|Auditoria da Plataforma]] — a trilha
- [[12-Eventos]] · [[15-Seguranca]]
