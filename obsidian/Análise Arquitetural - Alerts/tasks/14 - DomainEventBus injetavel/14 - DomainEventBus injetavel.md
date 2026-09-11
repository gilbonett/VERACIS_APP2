---
title: Task 14 - DomainEventBus injetável
tags:
  - alerts
  - core
  - gof
  - task
severidade: Média
esforco: Alto
fase: 3
status: pendente
---

#alerts #gof #task

# Task 14 — `DomainEvents` estático → `DomainEventBus` injetável

> Origem: [[Criacionais#Singleton — ⚠️ existe onde não deveria|Singleton]] · [[DI, Repository e Domain Events]] · TODO geral: [[00 - TODO Geral]]
> ⚠️ **Dívida do `core`** — toca todos os subdomínios. Maior task da lista; só depois da [[09 - Await nos handlers do DomainEvents|Task 09]] (mesma área, entregas independentes).

## O que fazer

`core/events/domain-events.ts` é singleton estático com estado global mutável (`handlersMap`, `markedAggregates`, `shouldRun`) — acoplamento invisível entre subdomínios, vazamento de estado entre testes (por isso existem `clearHandlers`/`clearMarkedAggregates`), impossível de mockar por injeção. Converter em serviço injetável gerenciado pelo container Nest (singleton **do container**, forma correta do padrão aqui).

## Como fazer

1. Criar `core/events/domain-event-bus.ts` — mesma API, sem `static`:

```ts
export class DomainEventBus {
  private handlersMap: Record<string, HandlerRegistration[]> = {};
  private markedAggregates: AggregateRoot<unknown>[] = [];

  markAggregateForDispatch(aggregate: AggregateRoot<unknown>) { /* ... */ }
  dispatchEventsForAggregate(id: UniqueEntityID) { /* ... */ }
  register(callback, eventClassName, guard?) { /* ... */ }
  // sem shouldRun global — testes usam instância própria
}
```

2. Prover globalmente: `@Global() @Module({ providers: [DomainEventBus], exports: [DomainEventBus] })`.
3. Migrar consumidores (incremental, um subdomain por PR):
   - **AggregateRoot** chama `DomainEvents.markAggregateForDispatch(this)` internamente — ponto mais delicado: ou o bus vira dependência do repositório (repo marca + despacha, agregado só acumula eventos — **recomendado**, agregado fica puro), ou mantém-se um locator temporário.
   - Repositórios (`PrismaAlertRepository` etc.): injetar `DomainEventBus`, trocar chamada estática.
   - Subscribers (`OnAlertCreated*` etc.): injetar bus no construtor, `this.bus.register(...)`.
4. Testes: instância nova por teste — deletar chamadas a `clearHandlers`/`clearMarkedAggregates` dos setups.
5. Deletar `DomainEvents` estático ao final da migração.

> [!warning] Estrangular, não big-bang
> Manter `DomainEvents` como fachada fina delegando para o bus durante a migração — cada subdomain migra em PR próprio com suite verde. Alerts primeiro (referência), depois os demais.

## Resultado esperado

- Nenhum acesso estático a eventos; bus injetado onde usado.
- Agregados acumulam eventos; repositórios (via bus) marcam e despacham.
- Testes sem limpeza manual de estado global.
- `DomainEvents` estático deletado.

## Checklist

- [ ] `DomainEventBus` criado + módulo global
- [ ] Decisão sobre marcação de agregados registrada (repo marca — recomendado)
- [ ] Fachada de transição `DomainEvents` → bus
- [ ] Alerts migrado (repos + subscribers) com suite verde
- [ ] Demais subdomínios migrados (1 PR cada)
- [ ] Setups de teste sem `clearHandlers`/`clearMarkedAggregates`
- [ ] `DomainEvents` estático deletado; grep limpo
