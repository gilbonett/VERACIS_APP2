---
title: Adicionar paginação por cursor em GET /alerts
tags:
  - database
  - performance
  - paginacao
  - media-prioridade
aliases:
  - Task 08
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Adicionar paginação por cursor em `GET /alerts`

| | |
|---|---|
| **Impacto** | Alto |
| **Esforço** | Médio |
| **Fonte** | [[Problemas-de-Paginacao]] §2 |

---

## O que precisa ser feito

`AlertDetailsRepository.findMany` busca todos os alertas que casam o filtro de status/comunidade, sem `take`/`skip`/`cursor` e sem `orderBy`. É o endpoint de maior tráfego do sistema.

## Como fazer

Replicar o padrão já usado em `NotificationRepository.findManyByRecipientId` (`apps/api/src/infra/database/prisma/notifications/repositories/prisma-notification-repository.ts:32`):

1. Adicionar `cursor?: string` e `limit: number` a `IAlertDetailsQuery` (`apps/api/src/domain/alerts/repositories/alert-details-repository.ts`).
2. Em `PrismaAlertDetailsRepository.findMany`, adicionar `orderBy: { createdAt: "desc" }`, `take: limit + 1`, `skip: cursor ? 1 : 0`, `cursor: cursor ? { id: cursor } : undefined`.
3. Retornar `{ alerts, nextCursor }` em vez de só `AlertDetails[]` — mesma forma usada em notificações.
4. Atualizar `GetAlertsUseCase` e o controller `GET /alerts` para aceitar `cursor`/`limit` como query params e devolver `nextCursor` na resposta.
5. Coordenar com o frontend a mudança de contrato (quebra de compatibilidade — a resposta deixa de ser um array simples).

## Como deve ficar o resultado

- `GET /alerts?limit=20` retorna no máximo 20 alertas + `nextCursor`.
- Tamanho da resposta não cresce mais linearmente com o total de alertas ativos na base.
- `filterAlertsByHealthVisibility` (aplicado após a busca) continua funcionando sobre a página retornada — atenção: se o filtro de visibilidade descartar itens da página, o tamanho final pode ficar menor que `limit`; documentar esse comportamento conhecido, não é bug.

## Ver também

- [[Banco-de-Dados]]
- [[00-To-Do-Geral]]
- [[08 - Paginacao Get Alerts/To-Do|To-Do]]
