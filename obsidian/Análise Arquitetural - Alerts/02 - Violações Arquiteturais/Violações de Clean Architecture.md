---
title: Violações de Clean Architecture
tags:
  - clean-architecture
  - alerts
  - refactor
---

#clean-architecture #alerts #refactor

# Violações de Clean Architecture

> Parte da [[01 - Visão Geral e Metodologia|análise arquitetural do Alerts]]. Dependências detalhadas em [[Dependências Indevidas entre Camadas]].

## V1 — Domínio importa infraestrutura (telemetria)

**Severidade: Alta · Esforço: Baixo**

`domain/alerts/use-cases/create-alert.ts:3` importa decorator da infra:

```ts
// domain/alerts/use-cases/create-alert.ts
import { ObserveBusiness } from "@/infra/telemetry/decorators/observe-business.decorator";
```

A camada de domínio passa a compilar contra a infraestrutura — inversão da regra de dependência. Qualquer mudança na telemetria (ex.: troca de OTel SDK) força recompilação/retest do domínio.

> [!warning] Regra de dependência violada
> `domain → infra` é a violação canônica de Clean Architecture. Hoje só `create-alert.ts` faz isso no Alerts, mas o precedente tende a se espalhar.

**Correção**: mover observabilidade para a borda (interceptor NestJS no controller, ou decorar o provider no módulo de infra). Alternativa pragmática: mover o decorator para `@/shared` sem dependência de infra concreta. Ver [[Refatoração Proposta - Use Cases]].

## V2 — Framework NestJS na camada de domínio

**Severidade: Média (decisão transversal do projeto) · Esforço: Alto**

Todos os use cases em `domain/alerts/use-cases/` usam `@Injectable()` e alguns usam `Logger` do `@nestjs/common`:

```ts
// domain/alerts/use-cases/close-expired-pending-alert.ts
import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class CloseExpiredPendingAlertUseCase {
  private readonly logger = new Logger(CloseExpiredPendingAlertUseCase.name);
```

`@Injectable()` é tolerável (padrão difundido em projetos NestJS+DDD; metadata inerte). O `Logger` concreto é pior: side effect de infraestrutura dentro do use case.

> [!tip] Trade-off honesto
> Remover `@Injectable()` do domínio exige `useFactory` manual em todos os módulos — custo alto, ganho baixo. **Não recomendo** essa cruzada. Recomendo apenas: (a) não usar `Logger` do Nest em use cases — o resultado `Either` já comunica a falha, quem loga é a borda; (b) manter a regra "nenhum import de `@/infra` dentro de `domain/`" (lintável via Biome/dependency-cruiser).

## V3 — `AlertAcceptedEvent` comentado: ciclo de vida quebrado

**Severidade: Alta (bug de negócio, não só estilo) · Esforço: Médio**

`domain/alerts/entities/alert.ts:123-136`:

```ts
public doAccept() {
  this.props.status = "ACCEPTED";
  // this.addDomainEvent(
  //   new AlertAcceptedEvent( ... ),
  // );
  this.touch();
}
```

`AlertAcceptedEvent` existe (`events/alert-accepted-event.ts`) mas **nunca é emitido nem assinado**. Consequências quando o alerta é aceito **via reações** (`CreateAlertReactionUseCase`):

1. O job de expiração PENDING (45 min) **não é cancelado** — `cancelPending` só roda no subscriber de `AlertCreatedEvent` com status `ACCEPTED` (aceito na criação). Um alerta confirmado pela comunidade aos 44 min é **fechado 1 minuto depois** pelo processor de pending? Não — o processor valida `alert.isPending` e falha com `AlertNotPendingError`. O sistema se salva por acidente, mas:
2. A expiração de ACCEPTED (30 min) **nunca é agendada** — alerta confirmado pela comunidade **fica aberto para sempre**.
3. `OnAlertCreatedNotifyMembers` só cobre alertas que **nascem** ACCEPTED — a comunidade **não é notificada** quando ela própria confirma um alerta. Ironia: o texto da notificação diz *"Alerta Confirmado pela Comunidade"*, mas ela só dispara quando um líder cria o alerta.

**Correção**: reativar a emissão em `doAccept()` e criar subscribers `OnAlertAccepted*` (cancelar pending, agendar accepted-expiration, notificar membros). O guard de `DomainEvents.register` já suporta isso. Detalhe em [[DI, Repository e Domain Events]].

## V4 — Persistência multi-tabela sem transação

**Severidade: Média · Esforço: Baixo**

`infra/database/prisma/alerts/repositories/prisma-alert-repository.ts:36-48`:

```ts
async create(alert: Alert): Promise<void> {
  await this.prisma.alert.create({ data });
  await Promise.all([
    this.alertEventsRepository.createMany(alert.events.getItems()),
    this.alertAttachmentsRepository.createMany(...),
    this.alertRiskRepository.createMany(...),
  ]);
  this.dispatchEventsForAggregate(alert);
}
```

Falha em `createMany` de events/risks deixa o alerta persistido **sem seus filhos** — agregado corrompido no banco. `save()` tem o mesmo problema com update + 6 writes em `Promise.all`. Correção: `prisma.$transaction`. Ver [[Outbox, Saga, Circuit Breaker, Retry e Bulkhead]].

## V5 — Agregado reconstituído incompleto + include desperdiçado

**Severidade: Média · Esforço: Baixo**

`PrismaAlertRepository.findById` faz `include: { events: true, attachments: true }`, mas `PrismaAlertMapper.toDomain` **ignora** esses dados — `Alert.reconstitute` cria listas vazias. Efeitos:

- Query paga o custo do join à toa.
- `alert.hasEvents` / `hasAttachments` **mentem** (sempre `false`) em qualquer alerta carregado do banco. Hoje ninguém depende disso pós-load, mas é uma bomba armada para a próxima regra que consultar essas propriedades.

**Correção mínima**: remover o `include` (lazy de verdade) **e** documentar no mapper que o agregado carrega sem coleções; ou mapear as coleções de fato. Escolher um — o estado atual é o pior dos dois.

## V6 — Regra de negócio hardcoded em lugares errados

**Severidade: Média · Esforço: Baixo**

| Regra | Onde está | Onde deveria estar |
|---|---|---|
| Quórum de 5 likes | `create-alert-reaction.ts:103` (`const minimumToConfirm = 5`) | Política de domínio nomeada |
| TTL pending 45 min | `infra/events/alerts/on-alert-created-schedule-pending-expiration.ts:33` | Config/política de domínio |
| TTL accepted 30 min | `infra/events/alerts/on-alert-created-schedule-accepted-expiration.ts:33` | Config/política de domínio |
| Categoria "Saúde" | `policies/health-alert-visibility.ts:4` (UUID literal) | Aceitável (documentado), mas frágil entre ambientes |
| Usuário "coringa" | `policies/single-click-alert-confirmation.ts:2` (UUID literal) | Config externa — é dado, não regra |

TTLs na infra significam que o **tempo de vida do alerta** (regra de negócio central, documentada em `Regras-de-Negocio/Alertas/05-Expiracao-Automatica`) mora num subscriber de infraestrutura.

## V7 — Controllers com tratamento de erro degenerado

**Severidade: Baixa · Esforço: Baixo**

- `create-alert.controller.ts:37-39`: `CreateAlertUseCase` retorna `Either<never, ...>` (nunca falha), mas o controller checa `isRight()` e lança `BadRequestException` genérico — código morto que mascara a tipagem.
- `get-alerts.controller.ts:33`: acessa `alerts.value.alerts` sem narrowing — funciona por `Either<never>`, mas quebra silenciosamente se o use case ganhar um caso de erro.
- `create-alert-attachment.controller.ts`: sem validação de que o `alertId` existe; integridade garantida só pela FK do banco (erro 500 em vez de 404).

## O que está correto (registrar como boa prática)

> [!tip] Boas práticas já presentes
> - **Repository Pattern** exemplar: contratos abstratos no domínio, implementação Prisma na infra, DI por classe abstrata como token.
> - **`Either<L, R>`** consistente nos use cases, com erros de domínio tipados e nomeados.
> - **Read model `AlertDetails`** separado do agregado (CQRS-lite) — leitura rica sem inchar o aggregate root.
> - **Watched lists** (`AlertEventList` etc.) para diff de coleções no `save()`.
> - **Políticas puras** (`health-alert-visibility`) com teste unitário dedicado.
> - **Filas BullMQ** com DLQ por fila, `jobId: alertId` (idempotência de agendamento) e telemetria nos processors.
