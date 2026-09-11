---
title: Eventos de Domínio - Alertas
tags:
  - regra-de-negocio
  - alertas
  - eventos
  - domain-events
aliases:
  - Alert Domain Events
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Eventos de Domínio

| | |
|---|---|
| **Domínio** | [[Alertas]] |
| **Código-fonte** | `apps/api/src/domain/alerts/events/`, `apps/api/src/infra/events/alerts/` |
| **Última atualização** | 2026-07-22 |

---

## 1. Catálogo

| Evento | Disparado em | Payload | Consumido por |
|---|---|---|---|
| `AlertCreatedEvent` | `Alert.create()`, sempre | `alertId`, `status`, `authorId`, `communityId`, `categoryId` | `OnAlertCreatedSchedulePendingExpiration`, `OnAlertCreatedScheduleAcceptedExpiration` |
| `AlertClosedEvent` | `Alert.doClose()`, sempre | `alertId` | Nenhum handler registrado no domínio de alertas até o momento |
| `AlertAcceptedEvent` | Definido em `events/alert-accepted-event.ts`, mas **não é emitido** — o disparo está comentado dentro de `Alert.doAccept()` | `alertId`, `authorId`, `communityId`, `categoryId` | — |

## 2. `AlertAcceptedEvent`: Evento Morto

> [!danger] Evento definido, nunca emitido
> `Alert.doAccept()` contém o seguinte trecho comentado:
> ```ts
> // this.addDomainEvent(
> //   new AlertAcceptedEvent(
> //     this.id,
> //     this.props.authorId,
> //     this.props.communityId,
> //     this.props.categoryId,
> //   ),
> // );
> ```
> Isso significa que **toda vez que um alerta é aceito** — seja na criação por não-membro (ver [[02-Criacao-de-Alertas]]), seja por confirmação comunitária (ver [[03-Confirmacao-Comunitaria]]) — nenhum evento de domínio é publicado. É a causa raiz da lacuna descrita em [[05-Expiracao-Automatica]] (seção 5): a expiração de 30 minutos para alertas `ACCEPTED` depende de um evento que só existe para o caminho de criação, nunca para o caminho de confirmação por reações.

## 3. `AlertClosedEvent`: Publicado sem Consumidor

`AlertClosedEvent` é emitido corretamente em todo `doClose()` (chamado tanto por `CloseExpiredPendingAlertUseCase` quanto por `CloseExpiredAcceptedAlertUseCase`), mas nenhuma busca por `AlertClosedEvent` fora do próprio arquivo de definição encontra um handler registrado — o evento está disponível para consumo futuro (ex.: notificações, auditoria) mas não é usado hoje dentro deste subdomínio.

## 4. Barramento de Eventos

Os eventos usam o barramento de domínio interno (`DomainEvents.register` / `addDomainEvent`), padrão compartilhado por todo o VERACIS — não é um sistema de mensageria externo. Handlers em `apps/api/src/infra/events/alerts/` se inscrevem via `setupSubscriptions()` no construtor, com um `guard()` opcional para filtrar por condição (ex.: `status === "PENDING"`).

## Ver também

- [[Alertas]] — índice do domínio
- [[02-Criacao-de-Alertas]]
- [[05-Expiracao-Automatica]]
- [[13-Observabilidade]]
