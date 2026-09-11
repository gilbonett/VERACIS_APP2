---
title: Padrões GoF Criacionais
tags:
  - gof
  - alerts
  - ddd
---

#gof #alerts #ddd

# Padrões GoF — Criacionais

> Mapa visual: [[Mapa de Padrões Aplicáveis.canvas]]. Veredito por padrão: **existe / deveria existir / não aplicar**.

## Factory Method — ✅ já existe (bem aplicado)

`Alert.create()` (`entities/alert.ts:191`) é um static factory method canônico de DDD: encapsula invariantes de criação (status inicial `PENDING`, auto-aceite por role, associações, emissão de `AlertCreatedEvent`), com `reconstitute()` separado para reidratação sem efeitos. Mesmo padrão em `AlertReaction`, `AlertComment`, `AlertDetails`, `Notification.createMany`.

> [!tip] Boa prática consolidada
> A dupla `create()` (com regras + eventos) / `reconstitute()` (sem efeitos) é exatamente a separação correta. Nada a fazer.

**Abstract Factory por tipo/canal (email, push, SMS, webhook)?** Não aplicar. O sistema não tem canais de notificação múltiplos no Alerts — notificação é in-app (persistida via `NotificationRepository`, entregue por SSE em outro subdomain). Criar uma família de fábricas para canais hipotéticos é especulação. Se um dia houver push/email, o ponto de extensão natural é o subdomain Notifications, não o Alerts.

## Builder — ❌ não aplicar

`CreateAlertData` tem 9 campos planos, todos obrigatórios exceto `description`. Um Builder adicionaria ~40 linhas para simular parâmetros nomeados que TypeScript já dá de graça via objeto literal. **Trade-off não se paga.** Se o payload crescer com combinações opcionais complexas (múltiplas condições/critérios), reavaliar — hoje não há sinal disso.

## Singleton — ⚠️ existe onde não deveria

`DomainEvents` (`core/events/domain-events.ts`) é um singleton estático global:

```ts
export class DomainEvents {
  private static handlersMap: Record<string, HandlerRegistration[]> = {};
  private static markedAggregates: AggregateRoot<unknown>[] = [];
  public static shouldRun = true;
```

Problemas reais (não teóricos):

1. **Estado global mutável** compartilhado entre todos os subdomínios e todos os testes — `clearHandlers()`/`clearMarkedAggregates()` existem justamente porque os testes vazam estado.
2. **`markedAggregates` como array estático**: em cenário concorrente (dois requests criando alertas), agregados de requests distintos convivem na mesma lista — funciona porque o dispatch é síncrono por id, mas é frágil.
3. `dispatch` não aguarda os callbacks (`callback(event)` sem `await`) — handler async que rejeita vira unhandled rejection. Ver [[DI, Repository e Domain Events]].

**Recomendação**: transformar em serviço injetável (`DomainEventBus`) registrado no container Nest — o padrão Singleton passa a ser gerenciado pelo container (escopo singleton do Nest), que é a forma correta dele existir aqui. Esforço médio (toca todos os subscribers), ganho alto em testabilidade. Não é urgência do Alerts especificamente — é dívida do `core`.

**Novos singletons manuais?** Não. O container Nest já resolve ciclo de vida.

## Prototype — ❌ não aplicar

Não existem "templates de alerta" no domínio — cada alerta nasce de input do usuário. Clonagem não tem caso de uso. Se o produto criar templates reutilizáveis de alerta, `Alert` já tem a infra necessária (`props` + `reconstitute`) para implementar `clone()` em minutos. YAGNI.

## Resumo

| Padrão | Estado | Ação |
|---|---|---|
| Factory Method | ✅ existe, exemplar | manter |
| Abstract Factory | — | não aplicar (sem famílias de produtos) |
| Builder | — | não aplicar (objeto literal basta) |
| Singleton | ⚠️ `DomainEvents` estático | migrar para injetável (dívida do core) |
| Prototype | — | não aplicar (sem templates) |
