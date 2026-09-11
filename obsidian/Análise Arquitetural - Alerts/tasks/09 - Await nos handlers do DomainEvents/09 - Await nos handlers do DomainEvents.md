---
title: Task 09 - Await nos handlers do DomainEvents
tags:
  - alerts
  - core
  - resilience
  - task
severidade: Média
esforco: Médio
fase: 2
status: pendente
---

#alerts #resilience #task

# Task 09 — Await + captura de erro nos handlers do `DomainEvents`

> Origem: [[DI, Repository e Domain Events#Defeito 2 — handlers fire-and-forget|Defeito 2]] · TODO geral: [[00 - TODO Geral]]
> ⚠️ **Dívida do `core`** — afeta todos os subdomínios, não só Alerts. Coordenar com o time.

## O que fazer

`apps/api/src/core/events/domain-events.ts:92-96` invoca handlers sem `await`:

```ts
for (const { callback, guard } of registrations) {
  if (guard && !(await guard(event))) continue;
  callback(event);   // ← promise rejeitada some no vácuo
}
```

`OnAlertCreatedNotifyMembers` faz 3 I/Os e **lança** `CategoryNotFoundError` — rejeição vira unhandled rejection, notificações somem silenciosamente, HTTP responde 201 como sucesso.

## Como fazer

1. Tornar o dispatch consciente de async, isolando falha por handler:

```ts
private static async dispatch(event: DomainEvent) {
  const registrations = DomainEvents.handlersMap[event.constructor.name] ?? [];

  const results = await Promise.allSettled(
    registrations.map(async ({ callback, guard }) => {
      if (guard && !(await guard(event))) return;
      await callback(event);
    }),
  );

  for (const r of results) {
    if (r.status === "rejected") {
      // logar com contexto: nome do evento + erro (Logger da borda ou console estruturado)
    }
  }
}
```

2. Ajustar tipo `DomainEventCallback` para `(event: unknown) => void | Promise<void>`.
3. Verificar chamadores de `dispatchEventsForAggregate`: hoje é `void` síncrono chamado dos repositórios — decidir se vira `await` (repositório espera handlers) ou permanece fire-and-forget **com log garantido** (mais seguro para latência HTTP; a perda passa a ser observável). Recomendado: manter não-bloqueante, mas com `allSettled` + log — o gap de entrega restante é coberto pela [[10 - Job de reconciliacao de alertas orfaos|Task 10]].
4. Rodar suites de **todos** os subdomínios (users, notifications, communities usam o mesmo core).

> [!warning] Mudança de timing observável
> Handlers que antes rodavam "eventualmente" podem expor testes com race conditions escondidas. Falhas novas em testes ≠ regressão — investigar caso a caso.

## Resultado esperado

- Nenhuma rejeição de handler não observada; log estruturado com evento + erro.
- `domain-events.spec.ts` cobrindo handler async que rejeita.
- Latência HTTP sem regressão relevante (decisão bloqueante/não-bloqueante registrada).

## Checklist

- [ ] `dispatch` com `Promise.allSettled` + log de rejeições
- [ ] Tipo do callback aceita `Promise<void>`
- [ ] Decisão bloqueante vs não-bloqueante registrada (comentário + esta nota)
- [ ] `domain-events.spec.ts` atualizado (handler que rejeita não engole erro)
- [ ] Suites de todos os subdomínios verdes
- [ ] Verificação em dev: falha forçada em `OnAlertCreatedNotifyMembers` aparece no log
