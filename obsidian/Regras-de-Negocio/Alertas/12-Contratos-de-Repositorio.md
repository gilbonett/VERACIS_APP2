---
title: Contratos de Repositório - Alertas
tags:
  - regra-de-negocio
  - alertas
  - repositorios
  - arquitetura
aliases:
  - Alert Repositories
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Contratos de Repositório

| | |
|---|---|
| **Domínio** | [[Alertas]] |
| **Código-fonte** | `apps/api/src/domain/alerts/repositories/` |
| **Última atualização** | 2026-07-22 |

---

## 1. Princípio Arquitetural

Seguindo [[Geral|VERACIS]] (seção 3), nenhum caso de uso deste domínio acessa o Prisma diretamente. Todos os contratos abaixo são interfaces abstratas definidas no domínio e implementadas pela camada de infraestrutura (`apps/api/src/infra/`) — as dependências apontam sempre do externo para o núcleo de negócio.

## 2. Catálogo de Repositórios

| Repositório | Responsabilidade | Métodos-chave |
|---|---|---|
| `AlertRepository` | CRUD do aggregate `Alert` (escrita) | `create`, `save`, `findById`, `updateStatus` |
| `AlertDetailsRepository` | Leitura do read model `AlertDetails` | `findById(id, currentUserId?)`, `findMany(IAlertDetailsQuery)` |
| `AlertReactionRepository` | Reações | `create`, `findByAlertIdAndAuthorId`, `findCountByAlertIdAndLiked` |
| `AlertCommentRepository` | Comentários | `create` (CRUD básico via `Repository<AlertComment>`) |
| `AlertAttachmentsRepository` | Associação de anexos | `createMany`, `deleteMany` |
| `AlertEventsRepository` | Associação de eventos | `createMany`, `deleteMany` |
| `AlertRiskRepository` | Associação de riscos | `createMany`, `deleteMany` |
| `AlertMetricsRepository` | Agregação de métricas | `findByCommunityId(communityId)` |

## 3. Separação Escrita/Leitura

`AlertRepository` (escrita, opera sobre a entidade `Alert`) e `AlertDetailsRepository` (leitura, opera sobre o read model `AlertDetails`) são contratos **distintos** e propositalmente não unificados — reflete a separação CQRS leve descrita em [[09-Consulta-de-Alertas]]. Casos de uso de comando (criar, reagir, expirar) dependem de `AlertRepository`; casos de uso de consulta (listar, buscar, comentar) dependem de `AlertDetailsRepository`.

## Ver também

- [[Alertas]] — índice do domínio
- [[09-Consulta-de-Alertas]]
- [[08-Metricas]]
