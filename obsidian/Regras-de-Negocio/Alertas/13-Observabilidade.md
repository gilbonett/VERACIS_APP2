---
title: Observabilidade - Alertas
tags:
  - regra-de-negocio
  - alertas
  - observabilidade
  - opentelemetry
aliases:
  - Alert Observability
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Observabilidade

| | |
|---|---|
| **Domínio** | [[Alertas]] |
| **Código-fonte** | `apps/api/src/infra/telemetry/decorators/` |
| **Última atualização** | 2026-07-22 |

---

## 1. Princípio

Seguindo [[Geral|VERACIS]] (seção 12), toda funcionalidade do domínio de Alertas considera logs estruturados, métricas e traces distribuídos. A instrumentação é aplicada via decorators reutilizáveis, não código de observabilidade espalhado manualmente nos casos de uso.

## 2. Decorators em Uso

| Decorator | Onde é aplicado | Cobre |
|---|---|---|
| `@ObserveBusiness({ flow, action })` | Casos de uso de negócio (ex.: `CreateAlertUseCase`) | Métricas e traces de fluxo de negócio |
| `@ObserveQueue({ operation, queue, jobName })` | Processadores BullMQ (`AlertPendingProcessor`, `AlertAcceptedProcessor`) e dispatcher (`QueueAlertDispatcher`) | Agendamento, processamento, conclusão, falha e stall de jobs |
| `@ObserveEvent({ name })` | Handlers de domínio (`OnAlertCreatedSchedulePendingExpiration`, `OnAlertCreatedScheduleAcceptedExpiration`) | Publicação/consumo de eventos de domínio |
| `@RecordCompleted` / `@RecordFailed` / `@RecordStalled` | Métodos `@OnWorkerEvent` dos processadores | Ciclo de vida do worker BullMQ |

## 3. Filas e Dead-Letter Queues

Cada fila de expiração ([[05-Expiracao-Automatica]]) possui uma DLQ dedicada:

| Fila principal | DLQ |
|---|---|
| `ALERT_PENDING_EXPIRATION` | `ALERT_PENDING_EXPIRATION_DLQ` |
| `ALERT_ACCEPTED_EXPIRATION` | `ALERT_ACCEPTED_EXPIRATION_DLQ` |

Jobs com falha são retidos (`removeOnFail: { count: 50 }`) para investigação, enquanto jobs concluídos com sucesso são removidos imediatamente (`removeOnComplete: true`).

## 4. Lacuna de Cobertura

Os casos de uso `CreateAlertReactionUseCase` e `CreateAlertCommentUseCase` **não** possuem o decorator `@ObserveBusiness` aplicado, diferente de `CreateAlertUseCase` — inconsistência a avaliar junto ao time de observabilidade, já que reações e comentários são fluxos de negócio tão centrais quanto a criação do alerta.

## Ver também

- [[Alertas]] — índice do domínio
- [[05-Expiracao-Automatica]]
- [[11-Eventos-de-Dominio]]
