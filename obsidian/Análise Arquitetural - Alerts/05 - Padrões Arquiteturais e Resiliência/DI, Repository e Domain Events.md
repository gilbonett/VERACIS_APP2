---
title: DI, Repository e Domain Events
tags:
  - ddd
  - clean-architecture
  - alerts
---

#ddd #clean-architecture #alerts

# DI, Repository Pattern e Domain Events

> Parte de [[01 - Visão Geral e Metodologia]]. Resiliência em [[Outbox, Saga, Circuit Breaker, Retry e Bulkhead]].

## Dependency Injection — ✅ consistente (nota alta)

- Todo o subdomain usa DI via container Nest; **nenhuma instanciação manual** de dependências foi encontrada.
- Contratos abstratos (`AlertRepository`, `AlertDetailsRepository`, `AlertDispatcher`) usados como **tokens de injeção** — técnica idiomática NestJS que dá inversão de dependência sem `@Inject(TOKEN)` verboso.
- Exceções: (a) `DomainEvents` estático — o único wiring fora do container ([[Criacionais#Singleton]]); (b) `@Injectable()` decorando classes de domínio ([[Violações de Clean Architecture#V2]]); (c) `membershipRepository` injetado e nunca usado em `CreateAlertReactionUseCase`.

## Repository Pattern — ✅ existe e bem feito (com 3 ressalvas)

Estrutura correta: 8 contratos em `domain/alerts/repositories/`, 8 implementações Prisma em `infra/database/prisma/alerts/repositories/`, mappers dedicados. Zero acesso a Prisma fora da infra. Separação leitura/escrita: `AlertRepository` (agregado) vs `AlertDetailsRepository` (read model) — CQRS-lite correto.

> [!warning] Ressalvas
> 1. **`updateStatus` é dead code** — declarado no contrato (`alert-repository.ts:5`) e implementado, nunca chamado. Além de morto, é leaky: update por campo contorna o agregado (permitiria mudar status sem passar por `doAccept`/`doClose`, pulando eventos e invariantes). **Deletar.**
> 2. **`Repository<E>` base força `findAll()`** em todo repositório. `PrismaAlertRepository.findAll` sem paginação/filtro é convite a full scan em produção — e ninguém o usa. Contrato base menor (create/save/findById/delete) e métodos de consulta declarados por repositório concreto.
> 3. **`findById` com include ignorado** — carrega `events`/`attachments` que o mapper descarta ([[Violações de Clean Architecture#V5]]).

## Domain Events — ✅ existem e bem modelados; ⚠️ 3 defeitos de execução

**Modelagem** (boa): `AlertCreatedEvent` (payload rico: status, author, community, category), `AlertClosedEvent`, `AlertAcceptedEvent` — imutáveis, com `getAggregateId()`, desacoplados dos handlers via `DomainEvents.register` + guards por status. Dispatch **pós-persistência** no repositório (padrão mark-and-dispatch correto: eventos não vazam antes do commit).

### Defeito 1 — `AlertAcceptedEvent` nunca emitido

O defeito mais grave do subdomain — detalhes e correção em [[Violações de Clean Architecture#V3]] e [[Refatoração Proposta - Use Cases#R2]].

### Defeito 2 — handlers fire-and-forget

`core/events/domain-events.ts:92-96`:

```ts
for (const { callback, guard } of registrations) {
  if (guard && !(await guard(event))) continue;
  callback(event);        // ← async handler não aguardado
}
```

`OnAlertCreatedNotifyMembers.handle` é async e faz 3 I/Os; se rejeitar (ex.: `CategoryNotFoundError` é **lançado**, não retornado), a promise rejeita no vácuo → unhandled rejection, notificações silenciosamente perdidas, request HTTP responde 201 como se tudo tivesse funcionado.

```ts
// depois — no mínimo:
await Promise.allSettled(
  registrations
    .filter(async ({ guard }) => !guard || (await guard(event)))
    .map(({ callback }) => callback(event)),
); // + log dos rejected
```

(Ou capturar e logar por handler; o ponto é: rejeição precisa ser observável.)

### Defeito 3 — sem garantia de entrega

Eventos são in-memory: crash entre o `INSERT` do alerta e o dispatch = alerta persistido **sem** agendamento de expiração e **sem** notificação — permanentemente, pois não há reprocessamento. Análise de risco e mitigação (outbox vs reconciliação) em [[Outbox, Saga, Circuit Breaker, Retry e Bulkhead]].

## Observações menores de modelagem

- `AlertReaction` estende `AggregateRoot` mas nunca emite eventos — se reação é agregado próprio (é, tem repositório), ok; só registrar que `AlertMetrics` estende `Entity` sendo read model puro (deveria ser `ValueObject`, como `AlertDetails`). Inconsistência cosmética.
- `ocurredAt` (typo de `occurredAt`) em todos os eventos — herdado do `DomainEvent` do core; renomear é churn sem valor, registrar apenas.
- Primitive obsession leve: `lat`/`lng` soltos (um VO `Coordinates` validaria range), `status` como string union em vez de VO. Custo/benefício baixo — não priorizar.
