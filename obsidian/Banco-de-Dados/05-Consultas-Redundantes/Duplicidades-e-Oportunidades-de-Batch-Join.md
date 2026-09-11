---
title: Duplicidades e Oportunidades de Batch-Join - Banco de Dados
tags:
  - database
  - performance
  - refactor
aliases:
  - Duplicidades e Batch-Join
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Duplicidades e Oportunidades de Batch-Join

| | |
|---|---|
| **Domínio** | [[Banco-de-Dados\|Banco de Dados]] |
| **Última atualização** | 2026-07-24 |

---

## 1. `include` completo de `AlertDetails` traz dados sensíveis não usados — 🔴 Confirmado

`PrismaAlertDetailsMapper.include` (`apps/api/src/infra/database/prisma/alerts/mappers/prisma-alert-details-mapper.ts`):

```ts
const include = {
  author: true,          // TODAS as colunas de User
  community: true,        // todas as colunas de Community
  comments: { include: { author: true }, orderBy: { createdAt: "desc" } }, // author: TODAS as colunas, por comentário
  reactions: true,
  events: { include: { event: { include: { category: true } } } },
  attachments: true,
} satisfies Prisma.AlertInclude;
```

`toDomain` só usa `raw.author.name` e `raw.comments[].author.name` — mas `author: true` traz **todas** as colunas de `User`, incluindo `password` (hash), `cpf`, `email`, `phone`, `birthDate`. Isso não é uma vulnerabilidade de exposição direta (o mapper filtra antes de devolver ao controller), mas é:

- **Over-fetch real**: cada alerta no feed traz o hash de senha do autor e de cada comentarista da rede, ida e volta entre Postgres e a aplicação, para nunca ser usado.
- **Risco de exposição futura**: se alguém alterar `toDomain` para "por conveniência" repassar `raw.author` adiante (comum sob pressão de prazo), o hash de senha e CPF de terceiros vazam para a API pública sem que o `include` precise mudar — o dado sensível já está na memória do processo.

**Correção**: substituir `author: true` por `select` mínimo em ambos os pontos:

```ts
const include = {
  author: { select: { id: true, name: true } },
  community: { select: { id: true, name: true } },
  comments: {
    include: { author: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  },
  reactions: true,
  events: { include: { event: { include: { category: true } } } },
  attachments: { select: { url: true } },
} satisfies Prisma.AlertInclude;
```

Reduz o volume de dados transferidos por linha e elimina o risco de exposição futura. Mesmo padrão de correção se aplica a `UserRepository` (`memberships → community → biome`, sem `select`) e a qualquer outro `include: { relacao: true }` onde só 1-2 campos da relação são consumidos pelo mapper — auditar com `grep -rn "include:" apps/api/src/infra/database/prisma`.

## 2. Duas queries de agregação que fazem o mesmo trabalho de junção — 🟡 Confirmado

Em `AlertMetricsRepository.findByCommunityId`, a 2ª query (categorias) e a 3ª (eventos) percorrem, em essência, o mesmo conjunto de `alerts` da comunidade — uma via a relação direta `Category → Alert`, outra via `Event → AlertEvent → Alert`. Não são literalmente duplicadas (agregam por dimensões diferentes), mas ambas re-filtram `alerts` por `communityId` de forma independente, sem reaproveitar o resultado do `groupBy` de status já calculado na 1ª query.

**Oportunidade**: se o volume justificar, uma única query mais ampla (`alert.findMany({ where: { communityId }, select: { id, status, categoryId, events: { select: { eventId } } } })`) seguida de agregação em memória substitui as 3 idas ao banco por 1 — troca custo de Postgres por custo de CPU da aplicação. Só vale a pena se o número de alertas por comunidade for pequeno (dezenas/centenas); com milhares, os `groupBy` recomendados em [[N1-Queries-Identificadas]] são mais eficientes. **Hipótese** — decisão depende do volume real de alertas por comunidade, não determinável estaticamente.

## 3. Nenhuma duplicidade de queries idênticas encontrada entre domínios — 🟢

Não há dois repositórios diferentes implementando a mesma consulta contra a mesma tabela (ex.: dois lugares calculando contagem de membros de uma comunidade de formas diferentes). `MembershipRepository.findCountByCommunityId` é o único ponto de contagem de membros, reaproveitado onde necessário.

## Ver também

- [[Banco-de-Dados]] — índice
- [[N1-Queries-Identificadas]]
- [[Outras-Oportunidades]]
