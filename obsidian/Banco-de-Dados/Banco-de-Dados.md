---
title: Banco de Dados
tags:
  - database
  - performance
  - dominio
  - indice
aliases:
  - Análise de Performance do Banco de Dados
  - Database Performance Analysis
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Banco de Dados
### Análise de Performance — Índice Mestre

[[Geral]] › **Banco de Dados**

| | |
|---|---|
| **Documento** | Auditoria de Performance de Banco de Dados — VERACIS |
| **Versão** | 1.0 |
| **Status** | Ativo |
| **Classificação** | Uso Interno |
| **Última atualização** | 2026-07-24 |
| **Código-fonte** | `apps/api/prisma/`, `apps/api/src/infra/database/prisma/` |
| **SGBD** | PostgreSQL (via Prisma v7 + `@prisma/adapter-pg`) |

---

## 1. Sobre este documento

Auditoria estática de performance de banco de dados do VERACIS: mapeamento de queries por fluxo, índices existentes vs. necessários, padrões de N+1, paginação e over-fetching. Segue o mesmo padrão institucional de [[Regras-de-Negocio|Regras de Negócio]] (índice, páginas numeradas, canvas e tasks executáveis).

> [!warning] Sem acesso a métricas reais
> Esta análise **não teve acesso a slow query log, `EXPLAIN ANALYZE` real, pg_stat_statements ou APM em produção** (tentativa de consulta ao Grafana MCP resultou em timeout de rede). Todos os achados são baseados em **inspeção estática do schema Prisma, das migrations SQL geradas e do código-fonte dos repositórios**. Onde o achado foi confirmado lendo o SQL gerado ou o código do repositório, está marcado como **Confirmado**. Onde depende de volume de dados ou padrão de tráfego real não observável estaticamente, está marcado como **Hipótese a validar**.

## 2. Índice de Notas

| # | Página | Resumo |
|---|---|---|
| 01 | [[01-Visao-Geral-e-Metodologia\|Visão Geral e Metodologia]] | Stack, escopo e método de análise |
| 02 | [[Queries-por-Fluxo\|Queries por Fluxo]] / [[Queries-Mais-Utilizadas\|Queries Mais Utilizadas]] | Inventário de queries por domínio e por endpoint |
| 03 | [[Queries-Lentas-Documentadas\|Queries Lentas Documentadas]] | Queries com plano de execução ineficiente identificado estaticamente |
| 04 | [[Indices-Existentes-por-Tabela\|Índices Existentes]] / [[Indices-Recomendados\|Recomendados]] / [[Indices-Redundantes-ou-Nao-Utilizados\|Redundantes]] | Auditoria completa de índices |
| 05 | [[N1-Queries-Identificadas\|N+1 Queries]] / [[Duplicidades-e-Oportunidades-de-Batch-Join\|Duplicidades e Batch-Join]] | Consultas redundantes |
| 06 | [[Problemas-de-Paginacao\|Problemas de Paginação]] / [[Outras-Oportunidades\|Outras Oportunidades]] | Paginação, SELECT *, cache |
| 07 | [[07-Plano-de-Acao-Priorizado\|Plano de Ação Priorizado]] | Consolidação e priorização de todos os achados |

## 3. Mapa de Gargalos

![[Banco-de-Dados/Canvas/Banco-de-Dados - Mapa de Gargalos.canvas]]

## 4. Achado Central

> [!danger] A tabela `alerts` — núcleo funcional da plataforma — não possui **nenhum índice além da chave primária**. Nem `status`, nem `community_id`, nem `author_id`, nem `category_id`, nem `created_at` são indexados. Confirmado lendo `apps/api/prisma/migrations/20260409151602_init/migration.sql:23-35` (só existe `alerts_pkey`). Toda listagem de alertas ([[Queries-Lentas-Documentadas|GetAlertsUseCase]]), todo dashboard de métricas por comunidade e toda contagem de alertas por categoria/evento faz table scan completo em `alerts`. Ver [[Indices-Recomendados]] (seção 1).

## 5. Tasks Executáveis

Todo achado deste documento com ação prática foi convertido em task executável, priorizada por impacto/esforço em [[tasks/00-To-Do-Geral|To-Do Geral]].

## 6. Lacunas e Débitos Técnicos Conhecidos

> [!danger] Registrado aqui para rastreabilidade — achados do código atual, não requisitos de negócio.

| Lacuna | Detalhe | Página |
|---|---|---|
| Sem métricas reais de produção | Nenhum slow query log, `EXPLAIN` ou APM disponível nesta análise — tudo é estático | Este documento, seção 1 |
| `findByPhone` é código morto | Implementado em `PrismaUserRepository` mas ausente do contrato `UserRepository` e sem nenhum chamador no código | [[Indices-Redundantes-ou-Nao-Utilizados]] |
| Feed de alertas sem `ORDER BY` explícito | `PrismaAlertDetailsMapper.toWhere` não define `orderBy`; a ordem retornada por `GET /alerts` depende da ordem física da tabela, não de `createdAt` | [[Queries-Lentas-Documentadas]] |
| Job de limpeza de sessões expiradas é stub | `OnCleanExpiredSessionTask` (cron horário) existe mas não executa lógica de exclusão — `sessions` cresce sem bound | [[Outras-Oportunidades]] |
| PostGIS mencionado na stack, não usado no schema | `lat`/`lng` são `Float` simples, sem extensão PostGIS, tipo `geography` ou índice espacial; nenhuma query por raio/distância encontrada no código atual | [[01-Visao-Geral-e-Metodologia]] |

## Ver também

- [[Geral]] — visão geral do projeto
- [[Regras-de-Negocio]] — regras de negócio por domínio
