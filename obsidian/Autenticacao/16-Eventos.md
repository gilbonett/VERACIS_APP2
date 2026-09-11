---
title: Eventos - Plataforma de Identidade
tags:
  - identity
  - auth
  - eventos
  - event-driven
aliases:
  - Eventos IAM
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Eventos

| | |
|---|---|
| **Domínio** | [[README\|Plataforma de Identidade]] |
| **Código-fonte** | `apps/api/src/domain/auth/events/`, `apps/api/src/core/events/` |
| **Última atualização** | 2026-07-24 |

---

## 1. Infraestrutura Existente — ✅

`DomainEvents` dispatcher + `AggregateRoot.addDomainEvent()` + subscribers (`on-otp-code-requested`, `on-password-changed`, `on-password-reset-requested`). Efeitos colaterais (e-mail) via fila BullMQ `MAIL` com DLQ. Este é o canal que a auditoria e as notificações novas **reutilizam** — não se cria um segundo mecanismo de eventos.

## 2. Eventos Atuais — ✅

| Evento | Emissor | Consumidores |
|---|---|---|
| `OtpCodeRequestedEvent` | `OtpChallenge.attachEmail()` | Envio de e-mail com código |
| `PasswordResetRequestedEvent` | `PasswordReset` (criação) | E-mail com link de reset |
| `PasswordChangedEvent` | Confirmação de reset | E-mail de aviso |

> [!warning] Lacuna confirmada: sign-in não emite evento algum — nem em sucesso, nem em falha. Auditoria de login ([[13-Auditoria]]) depende de criar esses eventos (IDP-009).

## 3. Eventos Novos — 🎯

| Evento | Emissor | Consumidores |
|---|---|---|
| `LoginSucceededEvent` / `LoginFailedEvent` | Orquestrador de sign-in | Audit; lockout (contador); notificação de novo dispositivo |
| `SessionRevokedEvent` / `SessionsRevokedGloballyEvent` | Session | Audit; invalidação de cache |
| `AccountLockedEvent` / `AccountUnlockedEvent` | Lockout | Audit; e-mail ao titular |
| `MfaEnabledEvent` / `MfaDisabledEvent` / `RecoveryCodeUsedEvent` | MFA | Audit; e-mail de alerta |
| `IdentityLinkedEvent` / `IdentityUnlinkedEvent` | Provider | Audit; e-mail |
| `TokenRefreshedEvent` / `RefreshReuseDetectedEvent` | Token (fase 7) | Audit; revogação em cadeia |
| `RoleChangedEvent` / `PermissionChangedEvent` | Authorization | Audit; invalidação de cache de permissão |

## 4. Convenções de Payload

```ts
interface IdentityDomainEvent {
  occurredAt: Date;
  aggregateId: UniqueEntityID;    // padrão já existente ✅
  correlationId: string;          // da telemetria OTEL ✅ — nunca gerar novo
  requestId: string;
  actor: { userId: string | null; ip: string | null; userAgent: string | null };
  // + campos específicos do evento
}
```

Regras: evento carrega **fato**, não intenção ("senha trocada", não "trocar senha"); payload mínimo suficiente para o consumidor não precisar consultar de volta o emissor; nunca conter segredo (senha, token, código) — nem hasheado.

## 5. Entrega e Confiabilidade

| Aspecto | Estratégia |
|---|---|
| Efeitos não-críticos (e-mail, audit) | Assíncrono via BullMQ (retry + DLQ) — padrão já existente ✅ |
| Consistência evento×escrita | Outbox na mesma transação quando o evento nasce de escrita ([[13-Auditoria]] §2) |
| Ordem | Não garantida entre eventos distintos — consumidores idempotentes por `eventId` |
| Caminho crítico | Autenticação **nunca** espera consumidor de evento — regra absoluta |

## Ver também

- [[README]] — índice
- [[13-Auditoria]]
- [[05-Dominios]] §9 (mapa de dependências)
