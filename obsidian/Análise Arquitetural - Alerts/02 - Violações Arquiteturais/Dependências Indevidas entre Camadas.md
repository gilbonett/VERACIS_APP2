---
title: Dependências Indevidas entre Camadas
tags:
  - clean-architecture
  - alerts
  - ddd
---

#clean-architecture #alerts #ddd

# Dependências Indevidas entre Camadas

> Mapa visual em [[Mapa de Dependências.canvas]]. Violações detalhadas em [[Violações de Clean Architecture]].

## Mapa de dependências (quem depende de quem)

### ✅ Dependências corretas (setas apontam para dentro)

```
Presentation (controllers/dtos/presenters)
    ↓ depende de
Application (use-cases)
    ↓ depende de
Domain (entities, events, policies, read-models, contratos de repositório)
    ↑ implementado por
Infrastructure (Prisma repos, QueueAlertDispatcher, subscribers)
```

| De | Para | Mecanismo | Avaliação |
|---|---|---|---|
| `infra/database/prisma/alerts/*` | `domain/alerts/repositories/*` | implementa contrato abstrato | ✅ inversão correta |
| `infra/queue/dispatchers/queue-alert-dispatcher` | `domain/queue/alert-dispatcher` | implementa porta | ✅ Adapter correto |
| `infra/http/controllers/alerts/*` | `domain/alerts/use-cases/*` | injeção | ✅ |
| `infra/events/alerts/*` | `domain/alerts/events/*` + porta `AlertDispatcher` | subscribe | ✅ |
| `infra/queue/processors/*` | `domain/alerts/use-cases/close-expired-*` | injeção | ✅ processor fino |

### ❌ Dependências que quebram a regra (de dentro para fora)

| De (camada interna) | Para (camada externa) | Arquivo | Severidade |
|---|---|---|---|
| Domain use case | `@/infra/telemetry` | `domain/alerts/use-cases/create-alert.ts:3` | **Alta** |
| Domain use cases (todos) | `@nestjs/common` (`Injectable`) | `domain/alerts/use-cases/*.ts` | Média (transversal ao projeto) |
| Domain use cases | `@nestjs/common` (`Logger`) | `close-expired-pending-alert.ts:18`, `close-expired-accepted-alert.ts:18` | Média |
| Domain subscriber | `@/infra/telemetry` + Nest | `domain/notifications/subscribers/on-alert-closed.ts` | Média |

### ⚠️ Dependências entre subdomínios (mapear, não necessariamente errado)

| De | Para | Observação |
|---|---|---|
| `domain/alerts/use-cases/create-alert-reaction` | `domain/users` (`MembershipRepository`, `UserRole`) | injetado mas **não usado** (`membershipRepository` morto) |
| `domain/alerts/use-cases/get-alert-metrics-by-community-id` | `domain/users` (`UserRepository`) | acopla Alerts a Users para descobrir a comunidade do usuário |
| `domain/alerts/*` | `domain/users/entities/user` (`UserRole`) | tipo compartilhado — aceitável, candidato a shared kernel |
| `infra/events/notifications/on-alert-created-notify-members` | `domain/categories`, `domain/notifications`, `domain/users` | subscriber de integração entre 4 subdomínios — ok como ACL informal, mas é o arquivo com maior fan-out do fluxo |

> [!warning] `UserRole` como shared kernel implícito
> `UserRole` é importado de `domain/users/entities/user` por 6+ arquivos do Alerts. Se Users mudar a entidade, Alerts quebra. Mover o tipo para `@/core` ou `@/shared` formaliza o shared kernel.

## Observações estruturais

- **Não existe `AlertsModule`**: os 7 use cases e 7 controllers do Alerts são registrados no `http.module.ts` monolítico (~140 providers). A coesão do subdomain existe em pastas, mas não na composição NestJS. Um `AlertsModule` daria fronteira física ao subdomain (ver [[Estruturais]] — discussão de Facade).
- **`domain/queue/alert-dispatcher.ts`** é uma porta bem colocada (domínio define, infra implementa), mas mora num "subdomain" `queue` que só existe para isso. Local mais natural: `domain/alerts/gateways/alert-dispatcher.ts` — a porta é do Alerts.
- **`DomainEvents`** (`core/events/domain-events.ts`) é singleton estático global — acoplamento invisível entre todos os subdomínios que publicam/assinam. Ver [[Criacionais]] (Singleton) e [[DI, Repository e Domain Events]].

## Regra de lint recomendada

Bloquear import de `@/infra` dentro de `src/domain/**` (dependency-cruiser ou regra Biome custom no CI). Custo ~1h, elimina a classe inteira de regressão V1/V2.
