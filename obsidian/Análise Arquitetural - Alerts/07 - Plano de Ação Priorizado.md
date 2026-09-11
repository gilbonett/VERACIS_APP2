---
title: Plano de Ação Priorizado
tags:
  - refactor
  - alerts
  - clean-architecture
---

#refactor #alerts #clean-architecture

# Plano de Ação Priorizado

> Consolidação de todas as notas. Severidade = impacto no negócio/arquitetura; Esforço = tamanho da mudança.

## Fase 1 — Quick wins (1 sprint, baixo risco)

| # | Ação | Severidade | Esforço | Nota de origem |
|---|---|---|---|---|
| 1 | Reativar `AlertAcceptedEvent` em `doAccept()` + subscribers (cancelar pending, agendar accepted, notificar comunidade) — **corrige bug de negócio**: alerta confirmado por reações nunca expira nem notifica | **Alta** | Médio | [[Violações de Clean Architecture#V3]], [[Refatoração Proposta - Use Cases#R2]] |
| 2 | `prisma.$transaction` em `PrismaAlertRepository.create/save` | **Alta** | Baixo | [[Violações de Clean Architecture#V4]] |
| 3 | Guard `currentItems.at(0)` em `GetAlertMetricsByCommunityIdUseCase` — **corrige crash** p/ usuário sem comunidade | **Alta** | Baixo | [[Refatoração Proposta - Use Cases#R3]] |
| 4 | Extrair política `reactionConfirmsAlert` (Strategy leve) do `CreateAlertReactionUseCase` + remover dependências/parâmetros mortos | Média | Baixo | [[Refatoração Proposta - Use Cases#R1]] |
| 5 | Guards de transição de estado dentro do agregado (`doAccept` só de PENDING etc.) | Média | Baixo | [[Comportamentais#State]] |
| 6 | `attempts + backoff` nos jobs BullMQ + mover para DLQ no `onFailed` (hoje DLQ é cenografia) | Média | Baixo | [[Outbox, Saga, Circuit Breaker, Retry e Bulkhead#Retry]] |
| 7 | Remover `@ObserveBusiness` de `create-alert.ts` (decorar provider no módulo) | Média | Baixo | [[Refatoração Proposta - Use Cases#R5]] |
| 8 | Deletar dead code: `updateStatus`, include ignorado no `findById`, `isRight()` de `Either<never>`, typo `GetAlertMetrcis` | Baixa | Baixo | [[06 - Duplicidades e Reuso#D5]] |
| 9 | TTLs de expiração como constantes de domínio nomeadas | Baixa | Baixo | [[06 - Duplicidades e Reuso#D2]] |

> [!warning] Ordem importa no item 1
> Migrar os subscribers guardados por `status === "ACCEPTED"` do `AlertCreatedEvent` para o `AlertAcceptedEvent` na mesma mudança — senão alertas criados já aceitos disparam efeitos em dobro ([[Refatoração Proposta - Use Cases#R2]]).

## Fase 2 — Consolidação (2-3 sprints)

| # | Ação | Severidade | Esforço | Nota de origem |
|---|---|---|---|---|
| 10 | Await/`allSettled` + log de rejeição nos handlers de `DomainEvents` (dívida do core, beneficia todos os subdomínios) | Média | Médio | [[DI, Repository e Domain Events]] |
| 11 | Job de reconciliação: fecha alertas PENDING/ACCEPTED com `updatedAt` além do TTL (cobre crash, evento perdido, job Redis perdido) | Média | Médio | [[Outbox, Saga, Circuit Breaker, Retry e Bulkhead#Outbox]] |
| 12 | Unificar definição de "alerta de saúde" nas 2 variantes da política de visibilidade | Média | Médio | [[06 - Duplicidades e Reuso#D3]] |
| 13 | Regra de lint: proibir `@/infra` dentro de `src/domain/**` | Média | Baixo | [[Dependências Indevidas entre Camadas]] |
| 14 | Mover `UserRole` para shared kernel; mover porta `AlertDispatcher` para `domain/alerts/gateways/` | Baixa | Baixo | [[Dependências Indevidas entre Camadas]] |

## Fase 3 — Estrutural (quando doer / com folga)

| # | Ação | Severidade | Esforço | Nota de origem |
|---|---|---|---|---|
| 15 | `AlertsModule` NestJS (tirar Alerts do `http.module.ts` monolítico) — idealmente como padrão replicado aos demais subdomínios | Média | Alto | [[Estruturais#Facade]] |
| 16 | `DomainEvents` estático → `DomainEventBus` injetável | Média | Alto | [[Criacionais#Singleton]] |
| 17 | Unificar use cases de expiração (opcional — avaliar valor dos erros distintos) | Baixa | Baixo | [[Refatoração Proposta - Use Cases#R4]] |

## O que decidimos **não** fazer (e por quê)

| Padrão/ideia | Motivo |
|---|---|
| Abstract Factory, Builder, Prototype, Proxy, CoR, Mediator, Template Method | Sem caso de uso real — complexidade não se paga ([[Criacionais]], [[Estruturais]], [[Comportamentais]]) |
| State pattern completo (classes por estado) | 4 estados triviais; guards de transição cobrem o risco |
| Specification formal com `and/or/not` | Funções puras atuais são suficientes até haver composição dinâmica |
| Outbox table + relay | Reconciliação entrega a garantia de negócio com fração do custo; outbox só com consumidores externos |
| Saga, Circuit Breaker | Sem transação distribuída, sem dependência externa síncrona |
| Bulkhead de pool Postgres | Sem evidência de contenção; observabilidade existente é o gatilho |

## Cobertura de testes (observação final)

Só 2 specs no subdomain (`health-alert-visibility.spec`, `create-alert-reaction.spec`). As refatorações da Fase 1 (política pura, guards de transição) são exatamente as que barateiam testes — escrever specs junto: `alert.spec` (transições + eventos emitidos) e `alert-confirmation.spec` (política extraída).
