---
title: Contratos de Repositório - Comunidades
tags:
  - regra-de-negocio
  - comunidades
  - repositorios
  - arquitetura
aliases:
  - Community Repositories
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Contratos de Repositório

| | |
|---|---|
| **Domínio** | [[Comunidades]] |
| **Código-fonte** | `apps/api/src/domain/communities/repositories/` |
| **Última atualização** | 2026-07-22 |

---

## 1. Princípio Arquitetural

Seguindo [[Geral|VERACIS]] (seção 3), nenhum caso de uso acessa o Prisma diretamente — contratos abstratos no domínio, implementação em `infra/database/prisma/communities/`.

## 2. Catálogo de Repositórios

| Repositório | Responsabilidade | Métodos-chave |
|---|---|---|
| `CommunityRepository` | Leitura (e escrita herdada) de comunidades | `findManyWithQueries({ biomeId? })`, mais o CRUD herdado de `Repository<Community>` |
| `EventRepository` | Leitura do catálogo de eventos | `findManyByCategoryId(categoryId)`, mais `findAll` herdado |

A implementação Prisma de `findManyWithQueries` e `findAll` ordena sempre por `name` ascendente — a ordenação é regra da infraestrutura, não parametrizável pelo domínio hoje.

## 3. Escrita Herdada Sem Uso

Ambos os contratos herdam `create`/`save` do `Repository<T>` genérico e a implementação Prisma os cumpre — mas nenhum caso de uso os chama ([[01-Modelo-e-Conceitos]] §5). A capacidade de escrita existe na infraestrutura, esperando um caso de uso que ainda não foi criado.

## 4. Repositório Relacionado Fora do Domínio

`BiomeRepository` (biomas) mora em `domain/common/repositories/` — ver a observação de localização em [[01-Modelo-e-Conceitos]] §2.

## Ver também

- [[Comunidades]] — índice do domínio
- [[01-Modelo-e-Conceitos]]
- [[02-Consulta-de-Comunidades]]
- [[03-Eventos]]
