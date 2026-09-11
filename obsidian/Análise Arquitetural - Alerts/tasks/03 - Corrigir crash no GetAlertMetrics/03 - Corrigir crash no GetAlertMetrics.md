---
title: Task 03 - Corrigir crash no GetAlertMetrics
tags:
  - alerts
  - bug
  - task
severidade: Alta
esforco: Baixo
fase: 1
status: pendente
---

#alerts #task

# Task 03 — Corrigir crash em `GetAlertMetricsByCommunityIdUseCase`

> Origem: [[Use Cases com Responsabilidades Excessivas#Caso médio: `GetAlertMetricsByCommunityIdUseCase`|análise]] · [[Refatoração Proposta - Use Cases#R3 — Guard em `GetAlertMetricsByCommunityIdUseCase`|R3]] · TODO geral: [[00 - TODO Geral]]

## O que fazer

`apps/api/src/domain/alerts/use-cases/get-alert-metrics-by-community-id.ts:35`:

```ts
const communityId = user.communities.currentItems[0].communityId;
```

Usuário sem comunidade → `TypeError: Cannot read properties of undefined` → HTTP 500. Deveria ser erro de domínio tratado.

## Como fazer

```ts
const membership = user.communities.currentItems.at(0);

if (!membership) {
  return left(new UserNotFoundError()); // ou criar UserWithoutCommunityError
}

const communityId = membership.communityId;
```

Decidir erro: reutilizar `UserNotFoundError` (rápido, mensagem imprecisa) ou criar `UserWithoutCommunityError` em `domain/users/errors/` (correto, +1 arquivo + mapeamento no controller). Recomendado: erro dedicado — o controller de métricas já trata left.

## Resultado esperado

- Usuário sem comunidade recebe 4xx com erro claro, não 500.
- Comportamento inalterado para usuário com comunidade.

## Checklist

- [ ] Guard `at(0)` + early return implementado
- [ ] Erro dedicado criado (ou decisão registrada de reutilizar `UserNotFoundError`)
- [ ] Controller `get-alert-metrics.controller.ts` mapeando o erro para status HTTP correto
- [ ] Teste unitário: usuário sem comunidade retorna left, não lança
- [ ] Suite verde
