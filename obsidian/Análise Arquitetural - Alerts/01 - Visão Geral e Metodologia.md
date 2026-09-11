---
title: Visão Geral e Metodologia
tags:
  - ddd
  - clean-architecture
  - alerts
  - refactor
---

#ddd #clean-architecture #alerts

# Visão Geral e Metodologia

> Análise arquitetural do subdomain **Alerts** (`apps/api/src/domain/alerts` + camadas de infra correlatas), realizada em 2026-07-23 sobre a branch `2950-structural-pattern-analytics`. Navegue pelo [[00 - Índice]].

## Escopo analisado

```
apps/api/src/
├── domain/alerts/
│   ├── entities/          Alert (aggregate root), AlertReaction, AlertComment,
│   │                      AlertAttachment(+List), AlertEvent(+List), AlertRisk(+List), AlertMetrics
│   ├── errors/            5 erros de domínio tipados
│   ├── events/            AlertCreatedEvent, AlertClosedEvent, AlertAcceptedEvent (morto)
│   ├── policies/          health-alert-visibility, single-click-alert-confirmation
│   ├── read-models/       AlertDetails (value object de leitura)
│   ├── repositories/      8 contratos abstratos
│   └── use-cases/         10 use cases
├── domain/queue/alert-dispatcher.ts        (porta de agendamento)
├── domain/notifications/subscribers/on-alert-closed.ts
├── infra/database/prisma/alerts/           (7 mappers, 8 repositórios Prisma)
├── infra/events/alerts/                    (2 subscribers de expiração)
├── infra/events/notifications/on-alert-created-notify-members.ts
├── infra/queue/                            (QueueAlertDispatcher, 2 processors BullMQ + DLQ)
└── infra/http/{controllers,dtos,docs,presenters}/alerts/
```

## Metodologia

1. Listagem da estrutura completa de arquivos do subdomain.
2. Leitura integral das camadas Domain → Application → Infrastructure → Presentation.
3. Rastreio ponta a ponta do fluxo "criar e disparar um alerta" (abaixo).
4. Identificação de code smells, violações de dependência e duplicações.
5. Classificação por severidade (Alta/Média/Baixa) e esforço (Alto/Médio/Baixo).
6. Consolidação em [[07 - Plano de Ação Priorizado]].

## Fluxo ponta a ponta: criar e disparar um alerta

```
POST /alerts
  → CreateAlertController.handle            [Presentation]
  → CreateAlertUseCase.execute              [Application/Domain]
  → Alert.create()                          [Domain]
      · status inicial PENDING
      · role ≠ MEMBER → doAccept() (nasce ACCEPTED)
      · registra AlertCreatedEvent no agregado
  → PrismaAlertRepository.create            [Infra]
      · persiste alert + events + attachments + risks (Promise.all, SEM transação)
      · dispatchEventsForAggregate() → DomainEvents (in-memory)
  → Subscribers (coreografia):
      · OnAlertCreatedSchedulePendingExpiration  (status PENDING → BullMQ delay 45min)
      · OnAlertCreatedScheduleAcceptedExpiration (status ACCEPTED → cancela pending, BullMQ delay 30min)
      · OnAlertCreatedNotifyMembers              (status ACCEPTED → cria Notifications p/ comunidade)
  → Expiração: AlertPendingProcessor/AlertAcceptedProcessor
      → CloseExpiredPending/AcceptedAlertUseCase → alert.doClose()
      → AlertClosedEvent → OnAlertClosed (notificação suprimida por design)
```

**Caminho paralelo — confirmação comunitária**: `CreateAlertReactionUseCase` aceita o alerta por 3 regras distintas (role ≠ MEMBER, membro "coringa" single-click, quórum de 5 likes). Ver [[Use Cases com Responsabilidades Excessivas]].

## Veredito geral

> [!tip] O subdomain está **acima da média** em estrutura DDD
> Repository Pattern com abstrações no domínio, `Either` para erros funcionais, domain events com dispatch pós-persistência, read model separado do agregado (CQRS-lite), políticas como funções puras testadas, filas com DLQ e jobId idempotente. A base é sólida — os problemas são pontuais, não estruturais.

> [!warning] Os 3 problemas que importam
> 1. **`AlertAcceptedEvent` morto** — aceitação por reação não cancela expiração pending, não agenda expiração accepted e não notifica a comunidade ([[Violações de Clean Architecture]]).
> 2. **Domínio importando infra** — decorators de telemetria e NestJS dentro de `domain/` ([[Dependências Indevidas entre Camadas]]).
> 3. **Persistência multi-tabela sem transação** e sem outbox ([[Outbox, Saga, Circuit Breaker, Retry e Bulkhead]]).

## Notas da análise

- [[Violações de Clean Architecture]]
- [[Dependências Indevidas entre Camadas]]
- [[Use Cases com Responsabilidades Excessivas]]
- [[Refatoração Proposta - Use Cases]]
- [[Criacionais]] · [[Estruturais]] · [[Comportamentais]]
- [[DI, Repository e Domain Events]]
- [[Outbox, Saga, Circuit Breaker, Retry e Bulkhead]]
- [[06 - Duplicidades e Reuso]]
- [[07 - Plano de Ação Priorizado]]
