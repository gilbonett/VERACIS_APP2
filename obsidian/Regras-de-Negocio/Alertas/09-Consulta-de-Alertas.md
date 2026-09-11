---
title: Consulta de Alertas
tags:
  - regra-de-negocio
  - alertas
  - leitura
  - read-model
aliases:
  - Get Alerts
  - Alert Details
  - Read Model de Alertas
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Consulta de Alertas

| | |
|---|---|
| **Domínio** | [[Alertas]] |
| **Casos de uso** | `GetAlertByIdUseCase`, `GetAlertsUseCase` |
| **Código-fonte** | `apps/api/src/domain/alerts/use-cases/get-alert-by-id.ts`, `get-alerts.ts`, `apps/api/src/domain/alerts/read-models/alert-details.ts` |
| **Última atualização** | 2026-07-22 |

---

## 1. Read Model Dedicado

Toda consulta (listagem e busca por ID) opera sobre `AlertDetails` — um objeto de valor (`ValueObject`) desnormalizado e otimizado para leitura, **não** a entidade de escrita `Alert`. Isso segue o princípio de CQRS leve adotado no domínio: escrita passa pelo aggregate `Alert` (`AlertRepository`), leitura passa pelo read model (`AlertDetailsRepository`).

### 1.1 Conteúdo de `AlertDetails`

| Campo | Descrição |
|---|---|
| `authorName`, `communityName` | Dados desnormalizados para evitar joins na apresentação |
| `reactions: { LIKE, DISLIKE }` | Contagem agregada de reações |
| `currentUserReaction` | Reação do usuário atual, se houver |
| `commentsCount`, `comments[]` | Contagem e lista de comentários |
| `events[]` | Eventos associados, com nome/ícone de evento e categoria |
| `attachments[]` | Anexos associados (URL) |

## 2. Filtro de Visibilidade Aplicado na Camada de Domínio

Tanto `GetAlertByIdUseCase` quanto `GetAlertsUseCase` aplicam o filtro de visibilidade de alertas de saúde ([[04-Visibilidade-Alertas-Saude]]) **depois** de buscar os dados no repositório — a filtragem é uma regra de domínio, não delegada à query SQL da infraestrutura.

- `GetAlertsUseCase`: busca via `AlertDetailsRepository.findMany(query)`, filtra com `filterAlertsByHealthVisibility`.
- `GetAlertByIdUseCase`: busca via `findById`, valida com `canViewHealthAlert`; nega com `AlertNotFoundError`.

## 3. Query de Listagem (`IAlertDetailsQuery`)

```ts
interface IAlertDetailsQuery {
  communityId?: string;
  currentUserId: string;
  currentUserRole: UserRole;
  status: AlertStatus[];
}
```

A listagem sempre exige `currentUserId` e `currentUserRole` (necessários para o filtro de visibilidade) e aceita filtro opcional por comunidade e por um conjunto de status.

## Ver também

- [[Alertas]] — índice do domínio
- [[04-Visibilidade-Alertas-Saude]]
- [[12-Contratos-de-Repositorio]]
