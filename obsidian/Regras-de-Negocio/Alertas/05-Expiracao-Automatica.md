---
title: Expiração Automática de Alertas
tags:
  - regra-de-negocio
  - alertas
  - expiracao
  - filas
  - bullmq
aliases:
  - Alert Expiration
  - TTL de Alertas
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Expiração Automática

| | |
|---|---|
| **Domínio** | [[Alertas]] |
| **Handlers** | `OnAlertCreatedSchedulePendingExpiration`, `OnAlertCreatedScheduleAcceptedExpiration` |
| **Casos de uso** | `CloseExpiredPendingAlertUseCase`, `CloseExpiredAcceptedAlertUseCase` |
| **Código-fonte** | `apps/api/src/infra/events/alerts/`, `apps/api/src/infra/queue/`, `apps/api/src/domain/alerts/use-cases/close-expired-*.ts` |
| **Última atualização** | 2026-07-22 |

---

## 1. Visão Geral

Alertas não ficam pendentes ou aceitos indefinidamente — dois relógios independentes, implementados como jobs atrasados no BullMQ, encerram alertas que não avançam no ciclo de vida a tempo. Ver [[Regras-de-Negocio/Alertas/Canvas/Alertas - Maquina de Estados.canvas|máquina de estados]].

## 2. TTLs

| Fila | TTL | Disparo | Ação ao expirar |
|---|---|---|---|
| `ALERT_PENDING_EXPIRATION` | **45 minutos** | `AlertCreatedEvent` com `status = PENDING` | `CloseExpiredPendingAlertUseCase` fecha o alerta se ainda `PENDING` |
| `ALERT_ACCEPTED_EXPIRATION` | **30 minutos** | `AlertCreatedEvent` com `status = ACCEPTED` | `CloseExpiredAcceptedAlertUseCase` fecha o alerta se ainda `ACCEPTED` |

Os TTLs estão hardcoded nos handlers (`PENDING_TTL_MS = 45 * 60 * 1000`, `ACCEPTED_TTL_MS = 30 * 60 * 1000`) — não são configuráveis por ambiente ou comunidade hoje.

## 3. Mecânica de Agendamento

- Ambos os handlers reagem exclusivamente a `AlertCreatedEvent`, filtrando pelo `status` no momento da criação (`guard()`).
- Os jobs usam `jobId = alertId`, garantindo no máximo um job ativo por fila por alerta — reagendar com o mesmo ID substitui o anterior.
- Se um alerta já nasce `ACCEPTED` (criado por `LEADER`/`MANAGER`/`ROOT`), o handler correspondente cancela qualquer job de expiração pendente (`cancelPending`) antes de agendar o de aceito — proteção contra jobs órfãos, embora nesse caminho normalmente não exista job pendente a cancelar.
- Cada fila possui uma fila de dead-letter (DLQ) dedicada: `ALERT_PENDING_EXPIRATION_DLQ`, `ALERT_ACCEPTED_EXPIRATION_DLQ`.

## 4. Idempotência dos Casos de Uso de Fechamento

Ambos os casos de uso reconferem o status atual do alerta antes de fechar:

```
CloseExpiredPendingAlertUseCase:
  se alerta não existe → AlertNotFoundError
  se alerta não está PENDING → AlertNotPendingError (no-op)
  senão → doClose()

CloseExpiredAcceptedAlertUseCase:
  se alerta não existe → AlertNotFoundError
  se alerta não está ACCEPTED → AlertNotAcceptedError (no-op)
  senão → doClose()
```

Isso protege contra corridas: se o alerta mudou de estado por outro caminho (por exemplo, confirmado pela comunidade) entre o agendamento do job e sua execução, o job simplesmente não faz nada.

## 5. Lacuna Crítica: Aceite via Reação Não Agenda Expiração

> [!danger] Alertas aceitos pela comunidade não expiram em 30 minutos
> O agendamento da fila `ALERT_ACCEPTED_EXPIRATION` só é disparado por `AlertCreatedEvent` com `status = ACCEPTED` — ou seja, **apenas quando o alerta já nasce aceito** (criado por não-membro, ver [[02-Criacao-de-Alertas]]).
>
> Quando um alerta `PENDING` é aceito posteriormente via reações comunitárias ([[03-Confirmacao-Comunitaria]]), `Alert.doAccept()` **não emite nenhum evento de domínio** — o disparo de `AlertAcceptedEvent` está comentado no código-fonte (`alert.ts`, dentro de `doAccept()`). Ver [[11-Eventos-de-Dominio]].
>
> **Consequência observável**: alertas confirmados organicamente pela comunidade (o caminho mais comum) nunca têm sua janela de 30 minutos agendada e permanecem `ACCEPTED` indefinidamente, até fechamento manual ou outro processo externo ao domínio.
>
> Isto é um achado do código atual, não uma regra de negócio desejada — deve ser validado com produto antes de qualquer correção ou antes de assumir, em outra funcionalidade, que todo `ACCEPTED` expira em 30 minutos.

## Ver também

- [[Alertas]] — índice do domínio
- [[01-Ciclo-de-Vida]]
- [[02-Criacao-de-Alertas]]
- [[03-Confirmacao-Comunitaria]]
- [[11-Eventos-de-Dominio]]
- [[13-Observabilidade]]
