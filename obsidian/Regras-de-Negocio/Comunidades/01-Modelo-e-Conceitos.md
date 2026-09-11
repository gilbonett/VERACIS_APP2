---
title: Modelo e Conceitos - Comunidades
tags:
  - regra-de-negocio
  - comunidades
  - modelo
aliases:
  - Community Model
  - Modelo de Comunidades
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Modelo e Conceitos

| | |
|---|---|
| **Domínio** | [[Comunidades]] |
| **Código-fonte** | `apps/api/src/domain/communities/entities/`, `apps/api/src/domain/common/entities/biome.ts`, `apps/api/src/domain/common/value-objects/slug-vo.ts` |
| **Última atualização** | 2026-07-22 |

---

## 1. Community

Unidade territorial central do VERACIS. Atributos:

| Campo | Obrigatório | Observação |
|---|---|---|
| `name` | Sim | Nome exibido |
| `slug` | Sim | Identificador legível e único (`@unique` + índice no banco) — value object `Slug` |
| `description` | Não | Texto livre |
| `lat`, `lng` | Sim | Localização geográfica da comunidade |
| `biomeId` | Sim | Bioma ao qual pertence (Amazônia, Cerrado, Caatinga nos seeds) |
| `authorId` | Sim | Usuário que criou o registro — nos seeds, sempre a conta `ROOT` |

No banco (`community.prisma`), `Community` tem relações reversas com `Membership` (vínculos de usuários — ver [[05-Vinculo-com-Comunidades]]) e `Alert` (alertas do território — ver [[Alertas]]).

> [!info] Sem ciclo de vida
> `Community` não tem campo de status nem transições — não existe comunidade "inativa", "arquivada" ou "pendente de aprovação" no modelo atual. A entidade é um cadastro de referência puro.

## 2. Biome

Classificação ecológica da comunidade (um bioma agrupa N comunidades).

> [!warning] Mora em `domain/common`, não em `domain/communities`
> Entidade (`Biome`), repositório (`BiomeRepository`) e o único caso de uso de escrita relacionado a território (`CreateBiomeUseCase`) vivem em `apps/api/src/domain/common/` — fora deste domínio. `CreateBiomeUseCase` é, curiosamente, o único caminho de escrita em todo o conjunto Comunidades/Biomas, e cria o bioma gerando o slug automaticamente a partir do nome (`Slug.createFromText`). Ao documentar ou alterar biomas, procure em `common`, não aqui. Candidato natural a migrar para este domínio numa refatoração futura.

## 3. Event

Catálogo de tipos de ocorrência (ex.: "Febre", "Enchente") vinculados a uma categoria. Detalhado em [[03-Eventos]] — listado aqui porque o arquivo mora em `domain/communities/entities/`, embora não tenha nenhuma relação estrutural com `Community`.

## 4. Slug (Value Object)

Compartilhado por `Community`, `Biome` e `Event` (todos com `slug` único e indexado no banco). `Slug.createFromText` normaliza texto para URL: NFKD (remove acentos), minúsculas, espaços → hífens, remove caracteres especiais, colapsa hífens repetidos.

```
"Comunidade Manoa" → "comunidade-manoa"
```

A unicidade do slug é garantida **apenas pela constraint do banco** (`@unique`) — nenhum caso de uso valida colisão de slug antes de persistir, o que hoje é seguro porque a escrita só acontece via seeds com slugs pré-definidos.

## 5. Fábricas de Entidade Sem Fluxo de Escrita

`Community.toCreate()` e `Event.create()` existem, mas os únicos chamadores são os mappers do Prisma (reconstituição a partir do banco) e, no caso de `Event.create`, o aggregate de Alertas montando a associação `AlertEvent`. **Nenhum caso de uso, controller ou seed programático do domínio cria comunidades ou eventos em runtime** — todo o conteúdo vem dos seeds versionados. Ver [[04-Dados-de-Referencia-e-Seeds]].

## Ver também

- [[Comunidades]] — índice do domínio
- [[03-Eventos]]
- [[04-Dados-de-Referencia-e-Seeds]]
- [[05-Vinculo-com-Comunidades]] — o lado "Usuários" da relação
