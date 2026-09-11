---
title: Eventos - Autorização
tags:
  - authorization
  - eventos
aliases:
  - Eventos Autorização
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Eventos de Domínio

| | |
|---|---|
| **Domínio** | [[README\|Plataforma de Autorização]] |
| **Última atualização** | 2026-07-24 |

---

Mesma infraestrutura ✅ da plataforma ([[Autenticacao/16-Eventos|Eventos da Identidade]]): `DomainEvents` + subscribers + BullMQ com DLQ; convenção de payload idêntica (`correlationId`/`requestId` da telemetria, ator, nunca segredo).

## 1. Catálogo

| Evento | Emissor | Consumidores |
|---|---|---|
| `RoleCreated` / `RoleUpdated` / `RoleDeleted` | Administração (catálogo) | Auditoria |
| `RolePermissionsChanged` | `PUT /authz/roles/:id/permissions` | Auditoria; **invalidação de cache de todos os usuários com o papel** ([[13-Cache]] §3) |
| `UserRoleAssigned` / `UserRoleRemoved` | Atribuição | Auditoria; invalidação do cache do usuário (síncrona no fluxo + evento para observadores) |
| `PermissionCacheInvalidated` | Invalidador | Observabilidade (métrica de churn de cache) |
| `AuthorizationDenied` | `AbilityService` (negações) | Telemetria/alarme — picos de negação = sinal de sonda ou de bug de configuração |
| `MembershipChanged` | **Domínio User** (a emitir — dependência registrada, RN-008) | Invalidação de cache (escopo COMMUNITY) |

## 2. Regras

1. **Invalidação crítica nunca depende só do evento** — a revogação invalida o cache **sincronamente** no próprio use case (RN-006); o evento é para observadores adicionais e reconciliação, não o mecanismo primário. Evento perdido ⇒ TTL de 300s é o teto de staleness (não-crítico, pois a via síncrona já agiu).
2. `AuthorizationDenied` é **evento de sinal**, não de auditoria por padrão — negações vão a métrica/log; só decisões administrativas e mudanças de estado entram na trilha ([[14-Auditoria]] §2). Motivo: volume (toda negação auditada incharia a trilha com ruído de UI).
3. Consumidores idempotentes por `eventId` (convenção da plataforma).

## Ver também

- [[README]] — índice
- [[13-Cache]] · [[14-Auditoria]]
- [[Autenticacao/16-Eventos|Eventos da Identidade]]
