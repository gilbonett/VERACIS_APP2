---
title: Padrões GoF Estruturais
tags:
  - gof
  - alerts
  - clean-architecture
---

#gof #alerts #clean-architecture

# Padrões GoF — Estruturais

> Mapa visual: [[Mapa de Padrões Aplicáveis.canvas]].

## Adapter — ✅ já existe (bem aplicado)

Dois adapters corretos no fluxo:

1. **`QueueAlertDispatcher`** (`infra/queue/dispatchers/queue-alert-dispatcher.ts`) adapta BullMQ à porta de domínio `AlertDispatcher`. O domínio fala "agende expiração"; a infra traduz para `queue.add` com `jobId`, `delay`, `removeOnComplete`. Troca de BullMQ por outro scheduler = 1 arquivo.
2. **`PrismaAlertRepository` + mappers** adaptam o modelo Prisma ao agregado (`PrismaAlertMapper.toDomain/toPrisma`).

> [!tip] O melhor Adapter do subdomain
> `AlertDispatcher` é a prova de que o time sabe usar o padrão: porta mínima (4 métodos), zero vazamento de BullMQ para o domínio. Única ressalva: a porta mora em `domain/queue/` — mover para `domain/alerts/gateways/` deixaria a posse explícita ([[Dependências Indevidas entre Camadas]]).

**Integração com provedores externos de notificação?** Não existe (notificação é in-app). Quando existir, replicar o padrão `AlertDispatcher`: porta no domínio + adapter na infra.

## Facade — ⚠️ parcial; recomendo `AlertsModule`, não Facade de classe

Não há fachada e, para consumidores HTTP, não precisa: cada controller consome um use case — granularidade correta.

O que falta é a **fronteira física**: use cases e controllers do Alerts estão registrados no `http.module.ts` monolítico (~140 providers). Um `AlertsModule` NestJS cumpriria o papel arquitetural do Facade (ponto único de entrada do subdomain, com `exports` explícitos do que outros módulos podem consumir):

```ts
@Module({
  imports: [DatabaseModule, QueueModule],
  controllers: [CreateAlertController, /* ... */],
  providers: [CreateAlertUseCase, /* ... */],
  exports: [], // nada exportado = subdomain fechado
})
export class AlertsModule {}
```

Trade-off: reorganização de módulos toca o projeto todo (mesma dívida existe nos outros subdomínios). Fazer quando o `http.module.ts` doer — ele já está perto disso.

## Decorator — ⚠️ existe, mas no lugar errado

Os decorators TS de telemetria (`@ObserveBusiness`, `@ObserveEvent`, `@ObserveQueue`, `@ObserveSpan`) são Decorators no espírito GoF: acoplam comportamento (métricas/spans) sem alterar a lógica. **O problema é onde são aplicados**: `@ObserveBusiness` dentro de `domain/alerts/use-cases/create-alert.ts` faz o domínio importar infra ([[Violações de Clean Architecture#V1]]).

**Depois (GoF Decorator de verdade, aplicado na composição):**

```ts
// infra/http/http.module.ts (ou AlertsModule)
{
  provide: CreateAlertUseCase,
  useFactory: (repo: AlertRepository, telemetry: BusinessTelemetry) =>
    telemetry.observe(new CreateAlertUseCase(repo), { flow: "alert", action: "create" }),
  inject: [AlertRepository, BusinessTelemetry],
}
```

Domínio limpo, telemetria preservada, e o wrapping vira decisão de composição — que é exatamente o ponto do padrão.

**Throttling/prioridade/formatação de alertas via Decorator?** Sem caso de uso hoje. Throttling de notificação, se necessário, pertence ao subdomain Notifications.

## Composite — ❌ não aplicar (ainda)

As regras de visibilidade (`canViewHealthAlert*`) são condições fixas AND/OR pequenas, expressas como funções puras legíveis. Um Composite de `Specification` (`AndSpec`, `OrSpec`...) só se paga quando as condições são **combinadas dinamicamente** (ex.: usuário monta filtros de alerta). Hoje seria abstração especulativa. Ver também Specification em [[Comportamentais]].

## Proxy — ❌ não aplicar

Sem necessidade de cache, lazy loading ou controle de acesso via proxy no Alerts. O controle de acesso existente (health visibility) é regra de domínio explícita — melhor visível na política do que escondida num proxy de repositório. Cache de leitura (`AlertDetails`) seria prematuro sem evidência de gargalo — e o projeto já tem observabilidade (Grafana/OTel) para detectar isso quando acontecer.

## Resumo

| Padrão | Estado | Ação |
|---|---|---|
| Adapter | ✅ `QueueAlertDispatcher`, mappers Prisma | manter; mover porta p/ `domain/alerts/gateways` |
| Facade | ⚠️ ausente | `AlertsModule` NestJS cumpre o papel; Facade de classe desnecessário |
| Decorator | ⚠️ existe, aplicado no domínio | mover wrapping para composição do módulo |
| Composite | — | não aplicar (condições fixas) |
| Proxy | — | não aplicar (sem cache/lazy/ACL genérico) |
