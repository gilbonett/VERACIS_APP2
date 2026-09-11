---
title: Task 10 - Job de reconciliação de alertas órfãos
tags:
  - alerts
  - resilience
  - task
severidade: Média
esforco: Médio
fase: 2
status: pendente
---

#alerts #resilience #task

# Task 10 — Job de reconciliação de alertas órfãos

> Origem: [[Outbox, Saga, Circuit Breaker, Retry e Bulkhead#Outbox Pattern — ausente · risco **médio e real**|Outbox → reconciliação]] · TODO geral: [[00 - TODO Geral]]

## O que fazer

Rede de segurança para o gap de entrega dos eventos in-memory: crash entre persistir alerta e despachar evento = alerta sem job de expiração → fica PENDING/ACCEPTED para sempre. Em vez de outbox (complexidade alta), um **repeatable job** que fecha alertas cujo TTL já estourou, direto pelo estado do banco.

## Como fazer

1. Query de órfãos (usar constantes da [[08 - Limpeza de dead code e TTLs nomeados|Task 08]]):

```ts
// alertas PENDING além do TTL (por createdAt) ou ACCEPTED além do TTL (por updatedAt ≈ momento do aceite)
where: {
  OR: [
    { status: "PENDING",  createdAt: { lt: new Date(Date.now() - PENDING_ALERT_TTL_MS) } },
    { status: "ACCEPTED", updatedAt: { lt: new Date(Date.now() - ACCEPTED_ALERT_TTL_MS) } },
  ],
}
```

> [!warning] `updatedAt` como proxy do momento de aceite
> Qualquer `save()` toca `updatedAt` — pode adiar o fechamento de um ACCEPTED. Aceitável como margem de segurança (reconciliação é backstop, não caminho primário). Se precisar de precisão, adicionar coluna `acceptedAt` — decidir na implementação.

2. Repeatable job BullMQ (fila nova `alert-reconciliation`, `every: 5 * 60 * 1000`), registrado no `queue.module`.
3. Processor: busca órfãos (limit ~100/rodada) e reusa `CloseExpiredPendingAlertUseCase` / `CloseExpiredAcceptedAlertUseCase` por alerta — idempotentes por validação de status, seguros contra corrida com o job normal de expiração.
4. Método novo no contrato: `AlertRepository.findExpired(...)` (ou repositório de leitura dedicado) — **não** usar `findAll`.
5. Métrica: contar órfãos encontrados por rodada (se > 0 com frequência, há problema upstream — alertar no Grafana).

## Resultado esperado

- Alerta que perdeu o agendamento (crash, deploy, evento perdido, job Redis sumido) é fechado em ≤ 5 min após estourar o TTL.
- Rodada sem órfãos = no-op barato (1 query indexada).
- Métrica de órfãos visível no Grafana.

## Checklist

- [ ] `findExpired` no contrato + impl Prisma (query indexada por status+data)
- [ ] Fila repeatable `alert-reconciliation` registrada (5 min)
- [ ] Processor reusando use cases de expiração (com limit por rodada)
- [ ] Decisão `updatedAt` vs coluna `acceptedAt` registrada
- [ ] Métrica de órfãos/rodada exportada + painel/alerta no Grafana
- [ ] Teste: alerta PENDING vencido no banco é fechado pela reconciliação
- [ ] Teste: alerta dentro do TTL não é tocado
