---
title: Queries Mais Utilizadas - Banco de Dados
tags:
  - database
  - performance
  - inventario
aliases:
  - Queries Mais Utilizadas
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Queries Mais Utilizadas

| | |
|---|---|
| **Domínio** | [[Banco-de-Dados\|Banco de Dados]] |
| **Última atualização** | 2026-07-24 |

---

> [!warning] Frequência real não medida — sem APM disponível ([[01-Visao-Geral-e-Metodologia]], seção 4), a classificação abaixo é inferida do **tipo** de endpoint (feed/listagem principal vs. CRUD administrativo pontual), não de contagem real de chamadas. Marcado como **Hipótese**.

## 1. Alto Tráfego (hipótese)

| Endpoint | Use Case | Query Principal | Por que é alto tráfego |
|---|---|---|---|
| `GET /alerts` | `GetAlertsUseCase` | `AlertDetailsRepository.findMany` | Feed principal da plataforma — tela de entrada dos usuários |
| `GET /alerts/:id` | `GetAlertByIdUseCase` | `AlertDetailsRepository.findById` | Tela de detalhe, acessada a cada clique no feed |
| `GET /notifications` | — | `NotificationRepository.findManyByRecipientId` | Consultado a cada abertura do sino de notificações |
| `GET /notifications/count` | — | `NotificationRepository.findCountByRecipientId` | Badge de contagem, provavelmente chamado em polling ou a cada navegação |
| `GET /profile` | `GetProfileUseCase` | `UserRepository.findById` (com cache Redis) | Chamado a cada requisição autenticada para resolver o usuário da sessão |
| `POST /auth/sign-in` | `SignInUseCase` | `UserRepository.findByCpf` | Todo login passa por aqui |
| `GET /communities` | `GetCommunitiesUseCase` | `CommunityRepository.findManyWithQueries`/`findAll` | Lista de comunidades, tela de onboarding/seleção |
| `GET /categories` | `GetCategoriesUseCase` | `CategoryRepository.findAll` | Dado de referência carregado ao montar formulário de criação de alerta |

## 2. Médio Tráfego (hipótese)

| Endpoint | Use Case | Query Principal |
|---|---|---|
| `GET /alerts/metrics` | `GetAlertMetricsByCommunityIdUseCase` | `AlertMetricsRepository.findByCommunityId` (dashboard) |
| `POST /alerts` | `CreateAlertUseCase` | `AlertRepository.create` + 3 `createMany` |
| `POST /alerts/:id/comments` | `CreateAlertCommentUseCase` | `AlertCommentRepository.create` |
| `POST /alerts/:id/reactions` | `CreateAlertReactionUseCase` | `AlertReactionRepository.findByAlertIdAndAuthorId` + `create`/`save` |
| `GET /communities/:id/events` | — | `EventRepository.findManyByCategoryId` |
| `PATCH /profile` | `UpdateProfileUseCase` | `UserRepository.save` + invalidação de cache |

## 3. Baixo Tráfego (hipótese)

Cadastro (`POST /auth/register`), fluxo de OTP (`send-otp`/`verify-otp`), reset de senha, upload de anexos individuais, CRUD administrativo de `biomes`/`risks`/`events`/`categories`. Baixo volume não significa isento de problema: `findAll()` sem paginação nessas entidades ainda é um risco à medida que o catálogo de referência crescer (ver [[Problemas-de-Paginacao]]).

## 4. Como Validar Esta Hipótese

Antes de investir esforço de otimização com base só nesta lista, validar com uma das fontes abaixo, na ordem de preferência:

1. `pg_stat_statements` habilitado no Postgres de produção → `SELECT query, calls, total_exec_time, mean_exec_time FROM pg_stat_statements ORDER BY calls DESC LIMIT 20;`
2. Métricas OTEL de banco já emitidas pela aplicação (o projeto já instrumenta spans de banco via `ObserveSpan`, ver `apps/api/src/infra/telemetry/`) — consultar Tempo/Mimir por nome de span quando o Grafana MCP estiver acessível.
3. Access log do NGINX/ALB por rota, como proxy de frequência de endpoint.

## Ver também

- [[Banco-de-Dados]] — índice
- [[Queries-por-Fluxo]]
- [[07-Plano-de-Acao-Priorizado]]
