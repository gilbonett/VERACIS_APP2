---
title: Dados de Referência e Seeds
tags:
  - regra-de-negocio
  - comunidades
  - seeds
  - dados-de-referencia
aliases:
  - Reference Data
  - Seeds do VERACIS
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Dados de Referência e Seeds

| | |
|---|---|
| **Domínio** | [[Comunidades]] |
| **Código-fonte** | `apps/api/prisma/seed.ts`, `apps/api/prisma/seeds/` |
| **Última atualização** | 2026-07-22 |

---

## 1. Por Que Esta Página Existe

Comunidades, biomas, categorias e eventos não são criados por usuários — nascem de **seeds versionados com IDs fixos**, e outros domínios escrevem esses IDs em constantes de código. Isso transforma o seed em parte da regra de negócio: alterar um ID aqui quebra silenciosamente uma política em outro domínio. Esta página é o registro central dessas dependências.

## 2. Mecânica dos Seeds

- `prisma/seed.ts` orquestra tudo; dados em `prisma/seeds/` (`biomes.ts`, `communities.ts`, `users.ts`, `memberships.ts`, `terms.ts`).
- Todas as escritas usam `upsert` com ID (ou slug) fixo — o seed é **idempotente**: rodar N vezes produz o mesmo estado, seguro em qualquer ambiente.
- IDs seguem um esquema mnemônico por prefixo:

| Prefixo | Tipo | Exemplo |
|---|---|---|
| `a1b2c3d4-...` | Usuários | `a1b2c3d4-0006-4000-8000-000000000006` |
| `b1b2c3d4-...` | Categorias | `b1b2c3d4-0004-4000-8000-000000000004` |
| `c1b2c3d4-...` | Biomas | `c1b2c3d4-0001-4000-8000-000000000001` |
| `d1b2c3d4-...` | Comunidades | `d1b2c3d4-0001-4000-8000-000000000001` |
| `f0e79a10-...` | Eventos climáticos (sufixo = código do ícone) | `f0e79a10-0000-4000-8000-000000004000` |

## 3. Constantes Cross-Domain que Dependem dos Seeds

> [!danger] Estes valores estão hardcoded em código de outros domínios — nunca alterar no seed sem atualizar os consumidores.

| Valor no seed | Consumidor | Efeito |
|---|---|---|
| Categoria **Saúde** = `b1b2c3d4-0004-4000-8000-000000000004` (`CAT_SAUDE`) | `HEALTH_ALERT_CATEGORY_ID` em `alerts/policies/health-alert-visibility.ts` | Toda a regra de [[04-Visibilidade-Alertas-Saude|visibilidade de alertas de saúde]] compara literalmente contra este UUID |
| Usuária **Mariana Costa** (`MEMBER_3`) = `a1b2c3d4-0006-4000-8000-000000000006` | `SINGLE_CLICK_LIKE_CONFIRMS_ALERT_USER_IDS` em `alerts/policies/single-click-alert-confirmation.ts` | O "membro coringa" de [[03-Confirmacao-Comunitaria|confirmação por um clique]] é esta conta de seed — papel `MEMBER`, senha padrão de seed, usada em demonstrações |

Se um ambiente for populado sem esses seeds (ou com IDs regenerados), ambas as políticas de Alertas continuam compilando, mas passam a nunca disparar — falha silenciosa típica de dado de referência acoplado a código.

## 4. Categorias Semeadas

| Categoria | ID (sufixo) | Eventos de exemplo |
|---|---|---|
| Climático | `...0001` | Vento Forte, Chuva Forte, Incêndio, Seca (ícones numéricos `4000`–`4014`) |
| Ambiental | `...0002` | Desmatamento, Queimada, Mineração ilegal, Poluição de rio |
| Infraestrutura | `...0003` | Falta de água, Esgoto a céu aberto, Alagamento urbano, Falta de energia |
| Saúde | `...0004` | Sintomas relatados para monitoramento por agentes de saúde — categoria com visibilidade restrita |

## 5. Usuários e Vínculos de Seed

`seeds/users.ts` cria contas fixas por papel (`ROOT`, líderes, membros) com senha padrão hasheada, e `seeds/memberships.ts` distribui os vínculos entre as comunidades de seed — é esse arranjo que permite demonstrar o fluxo completo de [[03-Confirmacao-Comunitaria|confirmação comunitária]] (líder que auto-aceita, membros que somam quórum, coringa que confirma sozinha) num ambiente recém-semeado.

> [!warning] Duas fontes de IDs de comunidade
> `seed.ts` define comunidades no bloco `IDS` (`d1b2c3d4-...`) e `seeds/communities.ts` define outras com UUIDs aleatórios fixados (`e866698b-...`). Ambos os conjuntos coexistem — ao referenciar uma comunidade de seed em teste ou demonstração, confirme qual conjunto o ambiente carregou.

## Ver também

- [[Comunidades]] — índice do domínio
- [[01-Modelo-e-Conceitos]]
- [[03-Eventos]]
- [[04-Visibilidade-Alertas-Saude]] — consumidor do ID de categoria Saúde
- [[03-Confirmacao-Comunitaria]] — consumidor do ID do membro coringa
