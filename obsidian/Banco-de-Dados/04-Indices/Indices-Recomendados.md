---
title: Índices Recomendados - Banco de Dados
tags:
  - database
  - performance
  - indices
  - refactor
aliases:
  - Índices Recomendados
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Índices Recomendados

| | |
|---|---|
| **Domínio** | [[Banco-de-Dados\|Banco de Dados]] |
| **Última atualização** | 2026-07-24 |

---

> [!tip] Todo índice acelera leitura e custa em escrita (`INSERT`/`UPDATE`/`DELETE` recalculam o índice) e em armazenamento. As recomendações abaixo priorizam tabelas com padrão de leitura claramente mais frequente que escrita, e evitam empilhar índices que se sobrepõem.

## 1. `alerts` — prioridade máxima

Dois índices cobrem os três padrões de acesso confirmados em [[Queries-Lentas-Documentadas]] (feed, métricas, contagem por categoria/evento):

```sql
CREATE INDEX alerts_community_id_status_idx ON alerts (community_id, status);
CREATE INDEX alerts_status_idx ON alerts (status);
```

- `alerts_community_id_status_idx`: cobre `AlertMetricsRepository.findByCommunityId` (filtro sempre por `community_id`) e o caso de `GET /alerts?communityId=...` (ambas colunas presentes).
- `alerts_status_idx`: cobre `GET /alerts` sem filtro de comunidade (só `status IN (...)`) — a primeira coluna do índice composto não ajuda aqui porque `community_id` não é filtrado.

> [!warning] `author_id` e `category_id` **não** entram nesta recomendação. Nenhuma query encontrada no código filtra `alerts` por `author_id` ou `category_id` diretamente — eles são usados só como destino de `include` (join partindo de `alerts` até `users`/`categories` pela PK do outro lado, que já é indexada). Se um fluxo futuro precisar de "meus alertas" (filtro por `author_id`), adicionar `CREATE INDEX alerts_author_id_idx ON alerts (author_id);` nesse momento — não antes, para não pagar custo de escrita sem benefício de leitura comprovado. **Hipótese, não achado confirmado.**

**Trade-off de escrita**: `alerts` recebe `INSERT` a cada novo alerta e `UPDATE` a cada mudança de status/aceite/expiração — volume moderado (ação de usuário, não batch). Dois índices adicionais é aceitável frente ao ganho no endpoint de maior tráfego do sistema.

## 2. `memberships`

```sql
CREATE INDEX memberships_community_id_idx ON memberships (community_id);
```

Resolve o Seq Scan confirmado em `findManyByCommunityId` e `findManyByCommunityIdsAndLeader` ([[Queries-Lentas-Documentadas]], seção 4). A PK composta `(user_id, community_id)` já cobre bem buscas por `user_id`.

## 3. `communities`

```sql
CREATE INDEX communities_biome_id_idx ON communities (biome_id);
```

Resolve o filtro opcional por `biomeId` em `findManyWithQueries`. `author_id` não tem query direta confirmada — mesma lógica de `alerts.author_id`, não recomendado agora.

## 4. `events`

```sql
CREATE INDEX events_category_id_idx ON events (category_id);
```

Resolve `EventRepository.findManyByCategoryId`, usado no endpoint de listagem de eventos por categoria.

## 5. Resumo — Impacto × Esforço

| Índice | Impacto | Esforço | Tabela afetada em escrita |
|---|---|---|---|
| `alerts (community_id, status)` | Alto | Baixo | `alerts` (moderado volume de escrita) |
| `alerts (status)` | Alto | Baixo | idem |
| `memberships (community_id)` | Médio | Baixo | `memberships` (baixo volume — só ao entrar/saír de comunidade) |
| `communities (biome_id)` | Médio | Baixo | `communities` (dado de referência, quase sem escrita) |
| `events (category_id)` | Médio | Baixo | `events` (dado de referência, quase sem escrita) |

Todos aplicáveis via uma única migration Prisma (`prisma migrate dev --name add_performance_indices`), sem downtime — `CREATE INDEX` no Postgres bloqueia escrita na tabela durante a criação; em tabelas com tráfego real de produção, considerar `CREATE INDEX CONCURRENTLY` fora do fluxo padrão de migration do Prisma (executar manualmente antes de gerar a migration correspondente, ou usar `migration.sql` editado à mão).

## Ver também

- [[Banco-de-Dados]] — índice
- [[Indices-Existentes-por-Tabela]]
- [[07-Plano-de-Acao-Priorizado]]
