---
title: Task 02 - Transação no PrismaAlertRepository
tags:
  - alerts
  - refactor
  - task
severidade: Alta
esforco: Baixo
fase: 1
status: pendente
---

#alerts #refactor #task

# Task 02 — `$transaction` no `PrismaAlertRepository`

> Origem: [[Violações de Clean Architecture#V4 — Persistência multi-tabela sem transação|V4]] · [[Outbox, Saga, Circuit Breaker, Retry e Bulkhead]] · TODO geral: [[00 - TODO Geral]]

## O que fazer

`create()` e `save()` em `apps/api/src/infra/database/prisma/alerts/repositories/prisma-alert-repository.ts` fazem múltiplos writes (alert + events + attachments + risks) via `Promise.all` **sem transação**. Falha no meio = agregado corrompido no banco (alerta sem filhos, ou update parcial).

## Como fazer

Envolver os writes em `prisma.$transaction`. Os repositórios filhos (`AlertEventsRepository` etc.) precisam aceitar o transaction client — padrão comum: método com parâmetro opcional `tx: Prisma.TransactionClient`.

```ts
async create(alert: Alert): Promise<void> {
  const data = PrismaAlertMapper.toPrisma(alert);

  await this.prisma.$transaction(async (tx) => {
    await tx.alert.create({ data });
    await this.alertEventsRepository.createMany(alert.events.getItems(), tx);
    await this.alertAttachmentsRepository.createMany(alert.attachments.getItems(), tx);
    await this.alertRiskRepository.createMany(alert.risks.getItems(), tx);
  });

  this.dispatchEventsForAggregate(alert); // dispatch DEPOIS do commit
}
```

Mesmo tratamento em `save()` (update + creates + deletes dos watched lists). Alternativa mais simples se os repos filhos só fazem `createMany`/`deleteMany` triviais: inline dos writes com `tx` direto no `PrismaAlertRepository` (menos indireção).

> [!tip] Manter o dispatch fora da transação
> `dispatchEventsForAggregate` já roda após a persistência — preservar isso: eventos só disparam com commit confirmado.

## Resultado esperado

- Falha em qualquer write → rollback total, banco sem agregado parcial.
- Eventos de domínio só despachados após commit.
- Comportamento externo idêntico no caminho feliz.

## Checklist

- [ ] `create()` envolvido em `$transaction`
- [ ] `save()` envolvido em `$transaction`
- [ ] Repos filhos aceitando `tx` (ou writes inlined)
- [ ] Dispatch de eventos permanece pós-commit
- [ ] Teste: falha simulada num write filho → nada persiste
- [ ] Suite existente verde (`pnpm test` no apps/api)
