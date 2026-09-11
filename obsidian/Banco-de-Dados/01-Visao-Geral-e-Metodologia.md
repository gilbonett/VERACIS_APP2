---
title: Visão Geral e Metodologia - Banco de Dados
tags:
  - database
  - performance
  - metodologia
aliases:
  - Metodologia da Auditoria de Performance
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Visão Geral e Metodologia

| | |
|---|---|
| **Domínio** | [[Banco-de-Dados\|Banco de Dados]] |
| **Código-fonte** | `apps/api/prisma/`, `apps/api/src/infra/database/prisma/` |
| **Última atualização** | 2026-07-24 |

---

## 1. Stack de Persistência

| Camada | Tecnologia |
|---|---|
| SGBD | PostgreSQL |
| ORM | Prisma v7 com `@prisma/adapter-pg` (Driver Adapters) |
| Cache | Redis (usado hoje apenas para `User.findById`, ver [[Outras-Oportunidades]]) |
| Migrations | 6 migrations em `apps/api/prisma/migrations/` (`20260409151602_init` até `20260515103000_add_map_tutorial_completed_at`) |

> [!tip] PostGIS está listado como parte da stack, mas não é usado hoje. `Alert.lat`/`Alert.lng` e `Community.lat`/`Community.lng` são `Float` simples — sem extensão `postgis`, tipo `geography`/`geometry` ou índice `GiST`. Nenhuma busca por raio/distância foi encontrada no código (`grep` por `ST_Distance`, `haversine`, `radius`, `nearby` não retornou resultado). Não é um problema de performance hoje porque a funcionalidade não existe — mas se "alertas próximos de mim" for implementado sem PostGIS, será uma varredura completa calculando distância linha a linha.

## 2. Escopo Analisado

9 domínios em `apps/api/src/domain/`: `alerts`, `attachments`, `auth`, `categories`, `communities`, `notifications`, `risks`, `users`, mais o módulo de suporte `common`. Todas as implementações Prisma em `apps/api/src/infra/database/prisma/<dominio>/repositories/*.repository.ts` e os 15 arquivos de schema em `apps/api/prisma/models/*.prisma` foram lidos.

## 3. Metodologia

1. **Schema e índices**: leitura de todos os `*.prisma` em `prisma/models/`, cruzada com o SQL real gerado em `prisma/migrations/*/migration.sql` — o schema declara a intenção, a migration é a fonte de verdade do que existe fisicamente no banco.
2. **Inventário de queries**: leitura de cada método público dos repositórios Prisma, classificando forma da query (`findMany`/`findUnique`/`groupBy`/etc.), filtros, `include`/`select`, ordenação e paginação.
3. **Rastreamento de chamadores**: para cada método de repositório, busca dos use-cases e controllers que o consomem, para inferir frequência de uso a partir do tipo de endpoint (listagem/feed = alto tráfego; CRUD administrativo = baixo tráfego).
4. **Padrões problemáticos**: busca dirigida por `$queryRaw`/`$executeRaw` (nenhum encontrado), por chamadas de repositório dentro de loops (N+1), por `include` aninhado em múltiplos níveis, e por `findAll()`/`findMany()` sem `take`/`skip`/`cursor`.
5. **Priorização**: todo achado classificado por impacto (Alto/Médio/Baixo) e esforço (Alto/Médio/Baixo) em [[07-Plano-de-Acao-Priorizado]].

## 4. Limitações Desta Análise

- **Sem dados reais de volume**: não sabemos quantas linhas existem hoje em `alerts`, `users`, `notifications` etc. Um full table scan em 500 linhas é irrelevante; em 5 milhões, é um incidente. Os achados de índice são estruturalmente corretos independente do volume (a ausência do índice é real), mas o **impacto atual** é uma hipótese até validar com `SELECT COUNT(*)` ou métricas de produção.
- **Sem `EXPLAIN ANALYZE` real**: os planos de execução descritos em [[Queries-Lentas-Documentadas]] são inferidos a partir do schema (ausência de índice ⇒ Postgres provavelmente escolhe Seq Scan), não capturados de fato.
- **Grafana MCP indisponível**: a tentativa de consultar datasources via `mcp__grafana__list_datasources` retornou timeout de rede (`grafana.veracis-app.com` inacessível a partir deste ambiente), então nenhuma métrica de Tempo/Mimir/Loki pôde ser usada para embasar frequência real de chamadas.

## Ver também

- [[Banco-de-Dados]] — índice do documento
- [[Queries-por-Fluxo]]
- [[Indices-Existentes-por-Tabela]]
