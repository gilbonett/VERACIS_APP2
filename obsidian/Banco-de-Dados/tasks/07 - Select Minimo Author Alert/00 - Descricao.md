---
title: Trocar include author:true por select mínimo em Alert/AlertComment
tags:
  - database
  - performance
  - refactor
  - alta-prioridade
  - seguranca
aliases:
  - Task 07
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Trocar `include: { author: true }` por `select` mínimo em `Alert`/`AlertComment`

| | |
|---|---|
| **Impacto** | Alto (dados sensíveis + volume de dados) |
| **Esforço** | Baixo |
| **Fonte** | [[Duplicidades-e-Oportunidades-de-Batch-Join]] §1 |

---

## O que precisa ser feito

`PrismaAlertDetailsMapper.include` traz `author: true` (autor do alerta) e `comments: { include: { author: true } }` (autor de cada comentário) — todas as colunas de `User`, incluindo `password` (hash), `cpf`, `email`, `phone`, `birthDate`. `toDomain` só usa `.name`. O mesmo vale para `community: true` (só `.name` é usado).

## Como fazer

Em `apps/api/src/infra/database/prisma/alerts/mappers/prisma-alert-details-mapper.ts`, trocar:

```ts
const include = {
  author: true,
  community: true,
  comments: { include: { author: true }, orderBy: { createdAt: "desc" } },
  reactions: true,
  events: { include: { event: { include: { category: true } } } },
  attachments: true,
} satisfies Prisma.AlertInclude;
```

por:

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

`toDomain` continua funcionando sem alteração (`raw.author.name`, `raw.community.name`, `raw.comments[].author.name`, `raw.attachments[].url` já são exatamente os campos selecionados).

## Como deve ficar o resultado

- O payload SQL retornado por `findMany`/`findById` de `AlertDetails` não traz mais `password`, `cpf`, `email`, `phone`, `birthDate` de `User` em nenhum ponto da resposta.
- Tipagem do TypeScript (`Prisma.AlertGetPayload<{ include: typeof include }>`) continua compilando sem erro — o `select` reduzido é um subconjunto válido do que `toDomain` já consumia.
- Testes existentes do domínio de alertas continuam passando sem alteração de asserção.

## Ver também

- [[Banco-de-Dados]]
- [[00-To-Do-Geral]]
- [[07 - Select Minimo Author Alert/To-Do|To-Do]]
