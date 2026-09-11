---
title: Outbox, Saga, Circuit Breaker, Retry e Bulkhead
tags:
  - alerts
  - resilience
  - clean-architecture
---

#alerts #resilience #clean-architecture

# Outbox, Saga, Circuit Breaker, Retry e Bulkhead

> Avaliação crítica: para cada padrão, **a ausência é risco real?** Contexto: eventos in-process, notificação in-app (DB + SSE), agendamento via BullMQ/Redis. Sem chamadas HTTP externas no fluxo de Alerts.

## Outbox Pattern — ausente · risco **médio e real**

Cadeia atual: `INSERT alert` → (sem transação) `INSERT` filhos → dispatch in-memory → subscribers fazem I/O (BullMQ, Notifications). Pontos de perda:

1. Crash/deploy entre persistir e despachar → alerta **sem job de expiração** (fica PENDING para sempre) e **sem notificações**. Sem reprocessamento: perda permanente.
2. Falha no `Promise.all` de filhos → agregado parcial no banco ([[Violações de Clean Architecture#V4]]).
3. Subscriber que rejeita → perda silenciosa ([[DI, Repository e Domain Events]], defeito 2).

**Recomendação em 2 níveis** (não pular direto para outbox completo):

- **Nível 1 (fazer já, esforço baixo)**: envolver `create`/`save` em `prisma.$transaction`. Elimina o agregado parcial. Não resolve a perda de eventos, mas fecha o buraco mais barato.
- **Nível 2 (avaliar, esforço médio)**: para o risco residual "alerta órfão sem expiração", **reconciliação é mais barata que outbox**: um repeatable job BullMQ (a cada ~5 min) que fecha alertas `PENDING`/`ACCEPTED` com `updatedAt` além do TTL. ~30 linhas, cobre crash, perda de evento e job Redis perdido de uma vez. Outbox table + relay só se o Alerts passar a publicar para consumidores externos (mensageria inter-serviço) — hoje não publica.

> [!tip] Reconciliação > Outbox neste contexto
> Outbox garante *entrega do evento*; o que o negócio precisa é garantir o *estado final* (alerta expira). Um job de varredura garante o estado final diretamente, com uma fração da complexidade — e é idempotente por natureza.

## Saga Pattern — ausente · ausência **correta**

O fluxo criar → notificar → expirar já é uma **coreografia** via domain events + delayed jobs, e cada passo é independente: não há compensação necessária (nada a desfazer se a notificação falhar). Saga orquestrada adicionaria um coordenador para um fluxo sem transação distribuída real. **Não aplicar.** O que falta não é orquestração, é confiabilidade dos passos (ver Outbox/Retry). Registrar a coreografia em doc (feito em [[01 - Visão Geral e Metodologia]]) resolve o "fluxo implícito".

## Circuit Breaker — ausente · ausência **correta**

Não há chamada síncrona a serviço externo no fluxo de Alerts: notificação é escrita em Postgres + push por SSE; agendamento é Redis local. Circuit breaker sem dependência externa instável é código morto. Se um provedor externo (SMS/push) entrar, aplicá-lo **no adapter** do provedor (no subdomain Notifications), nunca no domínio.

## Retry Pattern — **parcialmente ausente** · risco real **baixo/médio**

Estado atual dos jobs de expiração (`QueueAlertDispatcher.schedulePending/scheduleAccepted`):

```ts
await this.pendingQueue.add(JOB_NAMES.EXPIRE_PENDING_ALERT, { alertId }, {
  jobId: alertId,
  delay: delayMs,
  removeOnComplete: true,
  removeOnFail: { count: 50 },
});
```

**Sem `attempts`/`backoff`** → falha transitória (deadlock, blip de conexão) mata o job na primeira tentativa. As DLQs existem e os processors têm hooks `onFailed`, mas os hooks estão vazios (só telemetria) — **nada move o job para a DLQ nem reprocessa**. Ou seja: a infraestrutura de retry está *cenografada*, não ligada.

**Correção (esforço baixo, isolada da lógica de negócio — lugar certo):**

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

E no `onFailed`: quando `job.attemptsMade >= job.opts.attempts`, mover payload para a DLQ injetada. O processor já lança `UnrecoverableError` para job desconhecido — correto, não sofre retry.

Nota positiva: `jobId: alertId` torna o retry de *agendamento* idempotente, e os use cases de expiração são idempotentes por validação de status — retry é seguro ponta a ponta.

## Bulkhead Pattern — **parcial** · suficiente

- ✅ Filas separadas por operação (`alert-pending-expiration`, `alert-accepted-expiration`) + DLQs próprias — sobrecarga de um tipo de job não afoga o outro.
- ✅ Hardening recente de conexões Redis (BullMQ com prefix/TTL — PR 821) já isola presença/filas.
- ⚠️ Pool Postgres (Prisma) é compartilhado por todos os subdomínios — uma avalanche de queries de `AlertDetails` (a query mais pesada do subdomain, com 6 includes) compete com tudo. **Não recomendo bulkhead de pool agora**: sem evidência de contenção nos dashboards, é complexidade especulativa. A observabilidade existente (OTel + Grafana) é o gatilho — se `db.pool.wait` subir, aí sim segregar.

## Resumo

| Padrão | Estado | Risco da ausência | Ação |
|---|---|---|---|
| Outbox | ausente | médio (perda de expiração/notificação) | `$transaction` já; job de reconciliação; outbox só com consumidores externos |
| Saga | ausente | nenhum | não aplicar (coreografia atual correta) |
| Circuit Breaker | ausente | nenhum | não aplicar (sem deps externas síncronas) |
| Retry | cenografado (DLQ sem uso, sem attempts) | baixo/médio | `attempts + backoff` + mover p/ DLQ no `onFailed` |
| Bulkhead | parcial (filas/DLQ ok, pool DB compartilhado) | baixo | monitorar; agir só com evidência |
