---
title: To-Do Geral - Banco de Dados
tags:
  - database
  - performance
  - tasks
aliases:
  - To-Do Geral
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# To-Do Geral

| | |
|---|---|
| **Domínio** | [[Banco-de-Dados\|Banco de Dados]] |
| **Última atualização** | 2026-07-24 |

---

Checklist executável, derivado de [[07-Plano-de-Acao-Priorizado]].

## 🔴 Alta prioridade

- [ ] [[01 - Indice Alerts Status Community/00 - Descricao|Criar índices alerts(status) e alerts(community_id, status)]]
- [ ] [[02 - Remover Indices Duplicados Slug/00 - Descricao|Remover índices duplicados de slug (biomes/communities/events/risks)]]
- [ ] [[03 - Remover Indice Users Email Cpf Phone/00 - Descricao|Remover índice redundante users_email_cpf_phone_idx]]
- [ ] [[04 - Indice Memberships Community/00 - Descricao|Criar índice memberships(community_id)]]
- [ ] [[05 - Indice Communities Biome/00 - Descricao|Criar índice communities(biome_id)]]
- [ ] [[06 - Indice Events Category/00 - Descricao|Criar índice events(category_id)]]
- [ ] [[07 - Select Minimo Author Alert/00 - Descricao|Trocar include:author:true por select mínimo em Alert/AlertComment]]

## 🟡 Média prioridade

- [ ] [[08 - Paginacao Get Alerts/00 - Descricao|Adicionar paginação por cursor em GET /alerts]]
- [ ] [[09 - Groupby Alert Metrics/00 - Descricao|Reescrever AlertMetricsRepository com groupBy em vez de _count correlacionado]]
- [ ] [[10 - Paginacao Referencia/00 - Descricao|Adicionar paginação em findAll de communities/categories/biomes/risks]]
- [ ] [[11 - Cache Referencia/00 - Descricao|Cache Redis para categories/biomes/risks/events/communities]]
- [ ] [[12 - Include Seletivo User/00 - Descricao|Remover include de memberships em findByEmail/findByCpf quando não usado]]

## 🟢 Baixa prioridade

- [ ] [[13 - Job Limpeza Sessoes/00 - Descricao|Implementar exclusão real em OnCleanExpiredSessionTask]]
- [ ] [[14 - Remover FindByPhone/00 - Descricao|Remover ou formalizar findByPhone]]

## Ver também

- [[Banco-de-Dados]] — índice
- [[07-Plano-de-Acao-Priorizado]]
