---
title: Métricas de Alertas
tags:
  - regra-de-negocio
  - alertas
  - metricas
aliases:
  - Alert Metrics
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Métricas por Comunidade

| | |
|---|---|
| **Domínio** | [[Alertas]] |
| **Caso de uso** | `GetAlertMetricsByCommunityIdUseCase` |
| **Código-fonte** | `apps/api/src/domain/alerts/use-cases/get-alert-metrics-by-community-id.ts`, `apps/api/src/domain/alerts/entities/alert-metrics.ts` |
| **Última atualização** | 2026-07-22 |

---

## 1. Regras

- Requer que o usuário atual (`currentUserId`) exista — caso contrário, `UserNotFoundError`.
- A comunidade usada para calcular as métricas é sempre a **primeira** da lista de vínculos do usuário: `user.communities.currentItems[0]`.

> [!warning] Usuários multi-comunidade
> Se um usuário pertence a mais de uma comunidade, as métricas são calculadas **apenas** sobre a primeira da lista — não há agregação nem seleção de comunidade neste caso de uso. Isso pode gerar métricas incompletas ou inesperadas para usuários (ex.: `LEADER`/`MANAGER`) vinculados a múltiplas comunidades, dependendo da ordem de retorno de `communities.currentItems`.

## 2. Estrutura das Métricas (`AlertMetrics`)

| Campo | Conteúdo |
|---|---|
| `status.pending` / `.accepted` / `.closed` / `.rejected` / `.total` | Contagem de alertas por status na comunidade |
| `categories[]` | Contagem de alertas por categoria (`categoryId`, `categoryName`, `count`) |
| `events[]` | Contagem de alertas por evento associado (`eventId`, `eventName`, `alertsCount`) |

`AlertMetrics` é reconstituída diretamente a partir do repositório (`AlertMetricsRepository.findByCommunityId`) — não há regra de cálculo no domínio além da agregação em si, que fica sob responsabilidade da implementação de infraestrutura do repositório.

## Ver também

- [[Alertas]] — índice do domínio
- [[09-Consulta-de-Alertas]]
- [[12-Contratos-de-Repositorio]]
