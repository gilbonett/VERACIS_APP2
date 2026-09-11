---
title: Cache Redis para dados de referência
tags:
  - database
  - performance
  - cache
  - media-prioridade
aliases:
  - Task 11
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Cache Redis para `categories`/`biomes`/`risks`/`events`/`communities`

| | |
|---|---|
| **Impacto** | Médio |
| **Esforço** | Médio |
| **Fonte** | [[Outras-Oportunidades]] §2 |

---

## O que precisa ser feito

Só `UserRepository.findById` tem cache hoje. As 5 tabelas de referência acima são lidas com frequência alta/média e escritas raramente — candidatas ideais a cache-aside.

## Como fazer

Replicar o padrão de `PrismaUserRepository` (`apps/api/src/infra/database/prisma/users/repositories/prisma-user-repository.ts:20-34,122-151`):

```ts
private cacheKey(id?: string) {
  return id ? `categories:${id}` : "categories:all";
}

async findAll(): Promise<Category[]> {
  const cached = await this.cache.get<Category[]>(this.cacheKey());
  if (cached) return cached;

  const categories = await this.prisma.category.findMany();
  const domain = categories.map(PrismaCategoryMapper.toDomain);

  await this.cache.set(this.cacheKey(), domain, { ttl: 3600 });
  return domain;
}
```

Invalidar a chave em `save`/`create`/`delete`. TTL sugerido de 1h (dado muda raramente); ajustar por tabela conforme frequência real de alteração observada.

## Como deve ficar o resultado

- Segunda chamada a `GET /categories` (e às demais rotas de referência) dentro do TTL não gera query ao Postgres — resolvido via `CacheRepository` (Redis).
- `save`/`create`/`delete` de qualquer entidade cacheada invalida a chave correspondente, evitando dado desatualizado servido do cache.

## Ver também

- [[Banco-de-Dados]]
- [[00-To-Do-Geral]]
- [[11 - Cache Referencia/To-Do|To-Do]]
