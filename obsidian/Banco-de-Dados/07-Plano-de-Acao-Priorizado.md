---
title: Plano de Ação Priorizado - Banco de Dados
tags:
  - database
  - performance
  - plano-de-acao
aliases:
  - Plano de Ação Priorizado
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Plano de Ação Priorizado

| | |
|---|---|
| **Domínio** | [[Banco-de-Dados\|Banco de Dados]] |
| **Última atualização** | 2026-07-24 |

---

Consolidação de todos os achados deste documento, ordenados por impacto/esforço. Cada linha vira uma task executável em [[tasks/00-To-Do-Geral|To-Do Geral]].

## 🔴 Alta Prioridade (alto impacto, baixo esforço)

| # | Task | Impacto | Esforço | Fonte |
|---|---|---|---|---|
| 1 | Criar índices `alerts (community_id, status)` e `alerts (status)` | Alto | Baixo | [[Indices-Recomendados]] §1 |
| 2 | Remover índices duplicados de `slug` em `biomes`/`communities`/`events`/`risks` | Baixo (ganho)/Médio (evita débito) | Baixo | [[Indices-Redundantes-ou-Nao-Utilizados]] §1 |
| 3 | Remover `users_email_cpf_phone_idx` (redundante e mal ordenado) | Baixo-Médio | Baixo | [[Indices-Redundantes-ou-Nao-Utilizados]] §2 |
| 4 | Criar índice `memberships (community_id)` | Médio | Baixo | [[Indices-Recomendados]] §2 |
| 5 | Criar índice `communities (biome_id)` | Médio | Baixo | [[Indices-Recomendados]] §3 |
| 6 | Criar índice `events (category_id)` | Médio | Baixo | [[Indices-Recomendados]] §4 |
| 7 | Trocar `include: { author: true }` por `select` mínimo em `AlertDetails`/`AlertComment` (elimina over-fetch de `password`/`cpf`/`email`) | Alto (dados sensíveis) | Baixo | [[Duplicidades-e-Oportunidades-de-Batch-Join]] §1 |

## 🟡 Média Prioridade (alto impacto, esforço médio)

| # | Task | Impacto | Esforço | Fonte |
|---|---|---|---|---|
| 8 | Adicionar paginação por cursor em `GET /alerts` (`AlertDetailsRepository.findMany`) + `orderBy: createdAt desc` | Alto | Médio | [[Problemas-de-Paginacao]] §2 |
| 9 | Reescrever `AlertMetricsRepository.findByCommunityId` (2 `findMany + _count` → `groupBy`) | Médio-Alto | Médio | [[N1-Queries-Identificadas]] §1 |
| 10 | Adicionar paginação em `findAll` de `communities`/`categories`/`biomes`/`risks` (endpoints HTTP expostos) | Médio | Médio | [[Problemas-de-Paginacao]] §3 |
| 11 | Cache Redis para `categories`/`biomes`/`risks`/`events`/`communities` (padrão já usado em `User`) | Médio | Médio | [[Outras-Oportunidades]] §2 |
| 12 | Remover `include` de 3 níveis (`memberships→community→biome`) de `findByEmail`/`findByCpf` quando o caller não usa (ex.: `SignInUseCase`) | Baixo-Médio | Médio | [[N1-Queries-Identificadas]] §2 |

## 🟢 Baixa Prioridade

| # | Task | Impacto | Esforço | Fonte |
|---|---|---|---|---|
| 13 | Implementar exclusão real em `OnCleanExpiredSessionTask` (hoje é stub) | Baixo (hoje) / Médio (longo prazo) | Baixo | [[Outras-Oportunidades]] §3 |
| 14 | Remover ou formalizar `findByPhone` (código morto) | Baixo | Baixo | [[Indices-Redundantes-ou-Nao-Utilizados]] §3 |

## Como Validar Cada Correção

Sem métricas reais de produção disponíveis nesta análise ([[01-Visao-Geral-e-Metodologia]] §4), a validação de cada task depende de:

1. `EXPLAIN ANALYZE` antes/depois da query afetada, em ambiente com dados representativos.
2. Onde não houver `EXPLAIN` disponível, comparar `Seq Scan` → `Index Scan`/`Bitmap Index Scan` no plano de execução é o critério mínimo de aceite.
3. Para paginação: confirmar que o tamanho da resposta HTTP passa a ser limitado (`Content-Length` estável independente do total de linhas na tabela).

## Ver também

- [[Banco-de-Dados]] — índice
- [[tasks/00-To-Do-Geral|To-Do Geral]]
