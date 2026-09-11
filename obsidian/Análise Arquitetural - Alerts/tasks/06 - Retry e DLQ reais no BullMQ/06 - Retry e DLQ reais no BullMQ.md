---
title: Task 06 - Retry e DLQ reais no BullMQ
tags:
  - alerts
  - resilience
  - task
severidade: Média
esforco: Baixo
fase: 1
status: pendente
---

#alerts #resilience #task

# Task 06 — Retry com backoff + DLQ funcional no BullMQ

> Origem: [[Outbox, Saga, Circuit Breaker, Retry e Bulkhead#Retry Pattern — **parcialmente ausente** · risco real **baixo/médio**|Retry]] · TODO geral: [[00 - TODO Geral]]

## O que fazer

Jobs de expiração são single-shot: `QueueAlertDispatcher` agenda sem `attempts`/`backoff` — falha transitória (blip de conexão, deadlock) mata o job na 1ª tentativa. As DLQs existem e são injetadas nos processors, mas os hooks `onFailed` estão **vazios** (só telemetria) — nada move job para DLQ. Infra de resiliência cenografada.

## Como fazer

1. Em `apps/api/src/infra/queue/dispatchers/queue-alert-dispatcher.ts`, adicionar às options de `schedulePending` e `scheduleAccepted`:

```ts
{
  jobId: alertId,
  delay: delayMs,
  attempts: 3,
  backoff: { type: "exponential", delay: 5_000 },
  removeOnComplete: true,
  removeOnFail: { count: 50 },
}
```

2. Nos processors (`alert-pending-processor.ts`, `alert-accepted-processor.ts`), implementar `onFailed`:

```ts
@OnWorkerEvent("failed")
@RecordFailed()
async onFailed(job: Job, error: Error): Promise<void> {
  const exhausted = job.attemptsMade >= (job.opts.attempts ?? 1);
  if (exhausted) {
    await this.dlq.add(job.name, { ...job.data, error: error.message });
  }
}
```

3. Conferir que `UnrecoverableError` (job desconhecido) continua **não** sofrendo retry — comportamento nativo do BullMQ, já correto.

> [!tip] Idempotência já garantida
> `jobId: alertId` + validação de status nos use cases de expiração tornam retry seguro ponta a ponta. Nenhuma mudança de lógica de negócio necessária.

## Resultado esperado

- Falha transitória: job reexecuta até 3x com backoff exponencial (5s, 10s, 20s).
- Esgotadas as tentativas: payload vai para a DLQ correspondente com a mensagem de erro.
- `UnrecoverableError` vai direto para failed (sem retry) — inalterado.

## Checklist

- [ ] `attempts: 3` + backoff exponencial nos 2 schedules
- [ ] `onFailed` movendo para DLQ quando tentativas esgotadas (2 processors)
- [ ] `UnrecoverableError` verificado (sem retry)
- [ ] Teste: job que falha 2x e sucede na 3ª completa sem ir à DLQ
- [ ] Teste: job que falha 3x aparece na DLQ com erro
- [ ] Dashboards/alerts do Grafana conferidos (métricas de failed continuam corretas)
