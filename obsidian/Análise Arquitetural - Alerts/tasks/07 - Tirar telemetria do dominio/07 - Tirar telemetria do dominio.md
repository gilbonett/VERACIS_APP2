---
title: Task 07 - Tirar telemetria do domínio
tags:
  - alerts
  - clean-architecture
  - gof
  - task
severidade: Média
esforco: Baixo
fase: 1
status: pendente
---

#alerts #clean-architecture #gof #task

# Task 07 — Remover `@ObserveBusiness` do domínio

> Origem: [[Violações de Clean Architecture#V1 — Domínio importa infraestrutura (telemetria)|V1]] · [[Refatoração Proposta - Use Cases#R5 — Tirar telemetria do domínio|R5]] · [[Estruturais#Decorator — ⚠️ existe, mas no lugar errado|Decorator]] · TODO geral: [[00 - TODO Geral]]

## O que fazer

`apps/api/src/domain/alerts/use-cases/create-alert.ts:3` importa `@/infra/telemetry/decorators/observe-business.decorator` — única import direta `domain → infra` do subdomain. Remover mantendo a telemetria de negócio (`flow: "alert", action: "create"`).

## Como fazer

Opção recomendada — **Decorator na composição** (GoF de verdade): wrapping via `useFactory` no módulo onde o use case é provido (hoje `http.module.ts`; pós [[13 - Criar AlertsModule|Task 13]], no `AlertsModule`):

```ts
// no módulo (infra) — domínio intocado
{
  provide: CreateAlertUseCase,
  useFactory: (repo: AlertRepository) => {
    const useCase = new CreateAlertUseCase(repo);
    return wrapWithBusinessObservability(useCase, { flow: "alert", action: "create" });
  },
  inject: [AlertRepository],
}
```

`wrapWithBusinessObservability` = helper na infra de telemetria que envolve `execute` com a mesma lógica do decorator atual (reutilizar o miolo de `observe-business.decorator.ts`).

Opção mínima (se factory parecer pesado agora): mover o decorator para `@/shared/telemetry` sem imports de infra concreta — resolve o import path; dependência conceitual permanece, registrar como aceitável.

> [!warning] Conferir outros usos
> Antes de fechar: `grep -rn "@/infra" apps/api/src/domain` — garantir que nenhum outro arquivo de domínio (de qualquer subdomain) regrediu. A trava permanente é a [[12 - Lint de camadas e shared kernel UserRole|Task 12]].

## Resultado esperado

- Zero imports de `@/infra` dentro de `apps/api/src/domain/alerts/`.
- Métricas de negócio do fluxo de criação de alerta inalteradas nos dashboards.

## Checklist

- [ ] Decisão: useFactory (recomendado) vs mover decorator p/ shared
- [ ] `@ObserveBusiness` removido de `create-alert.ts`
- [ ] Wrapping aplicado na composição do módulo
- [ ] `grep "@/infra"` em `src/domain` limpo (Alerts)
- [ ] Métrica `flow=alert action=create` visível no Grafana após deploy local
- [ ] Suite verde
