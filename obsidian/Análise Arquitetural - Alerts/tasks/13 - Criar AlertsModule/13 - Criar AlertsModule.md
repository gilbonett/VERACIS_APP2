---
title: Task 13 - Criar AlertsModule
tags:
  - alerts
  - clean-architecture
  - task
severidade: Média
esforco: Alto
fase: 3
status: pendente
---

#alerts #clean-architecture #task

# Task 13 — Criar `AlertsModule` (fronteira física do subdomain)

> Origem: [[Estruturais#Facade — ⚠️ parcial; recomendo `AlertsModule`, não Facade de classe|Facade → AlertsModule]] · TODO geral: [[00 - TODO Geral]]
> Fase 3 — fazer quando o `http.module.ts` doer, idealmente como padrão replicável aos outros subdomínios.

## O que fazer

Alerts não tem fronteira na composição NestJS: 7 controllers + 7 use cases registrados no `http.module.ts` monolítico (~140 providers). Criar `AlertsModule` agrupando tudo do subdomain, com `exports` explícitos (idealmente vazio = subdomain fechado).

## Como fazer

1. Criar `apps/api/src/infra/modules/alerts.module.ts` (módulo é composição → mora na infra):

```ts
@Module({
  imports: [DatabaseModule, QueueModule /*, AuthModule se guards precisarem */],
  controllers: [
    CreateAlertController, CreateAlertCommentController,
    CreateAlertReactionController, GetAlertMetricsController,
    GetAlertByIdController, GetAlertsController, CreateAlertAttachmentController,
  ],
  providers: [
    CreateAlertUseCase, CreateAlertCommentUseCase, CreateAlertReactionUseCase,
    GetAlertByIdUseCase, GetAlertsUseCase, CreateAlertAttachmentUseCase,
    GetAlertMetricsByCommunityIdUseCase,
    // subscribers do Alerts (OnAlertCreated*, OnAlertAccepted* da Task 01)
  ],
  exports: [], // nada exportado — consumo externo só via HTTP/eventos
})
export class AlertsModule {}
```

2. Remover os registros correspondentes do `http.module.ts`; importar `AlertsModule` no módulo raiz.
3. Verificar dependências cruzadas: `GetAlertMetricsByCommunityIdUseCase` precisa de `UserRepository` (via `DatabaseModule`); `OnAlertCreatedNotifyMembers` usa providers de notifications/categories/users — decidir se ele pertence ao `AlertsModule` ou a um futuro `NotificationsModule` (é subscriber de integração; ver [[Dependências Indevidas entre Camadas]]).
4. Se a [[07 - Tirar telemetria do dominio|Task 07]] usou `useFactory`, os factories vêm juntos.
5. Validar boot da aplicação + swagger + smoke test dos 7 endpoints.

> [!tip] Piloto para os demais subdomínios
> Fazer Alerts primeiro (subdomain mais bem estruturado), documentar o passo a passo, replicar para users/communities/notifications em PRs separados.

## Resultado esperado

- Zero referências a Alerts no `http.module.ts`.
- `AlertsModule` com `exports: []` — dependências de entrada visíveis nos `imports`.
- Aplicação boota; todos endpoints de alerts funcionais; swagger inalterado.

## Checklist

- [ ] `alerts.module.ts` criado com controllers + use cases + subscribers
- [ ] Registros removidos do `http.module.ts`; import no módulo raiz
- [ ] Decisão sobre onde vive `OnAlertCreatedNotifyMembers` registrada
- [ ] Factories de telemetria (Task 07) migrados junto
- [ ] Boot + swagger OK
- [ ] Smoke test dos 7 endpoints (criar, listar, get, reaction, comment, attachment, metrics)
- [ ] Passo a passo documentado para replicar nos outros subdomínios
