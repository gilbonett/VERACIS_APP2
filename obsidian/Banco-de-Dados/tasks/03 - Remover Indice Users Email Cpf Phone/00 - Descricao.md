---
title: Remover índice redundante users_email_cpf_phone_idx
tags:
  - database
  - performance
  - indices
  - alta-prioridade
aliases:
  - Task 03
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Remover índice redundante `users_email_cpf_phone_idx`

| | |
|---|---|
| **Impacto** | Baixo-Médio |
| **Esforço** | Baixo |
| **Fonte** | [[Indices-Redundantes-ou-Nao-Utilizados]] §2 |

---

## O que precisa ser feito

`users` tem `@@index([email, cpf, phone])` além dos índices únicos de `email` e `cpf`. `email`/`cpf` já são cobertos pelos índices únicos; `phone` nunca é a coluna mais à esquerda, então nenhuma busca só por telefone se beneficia deste índice. Não há, hoje, nenhuma query real que filtre pelas 3 colunas juntas.

## Como fazer

Remover a linha `@@index([email, cpf, phone])` de `apps/api/prisma/models/user.prisma`:

```prisma
model User {
  // ...
  @@map("users")
}
```

Gerar migration:

```bash
pnpm --filter api prisma migrate dev --name drop_users_email_cpf_phone_idx
```

## Como deve ficar o resultado

- SQL gerado contém `DROP INDEX "users_email_cpf_phone_idx";`.
- `users_email_key` e `users_cpf_key` permanecem intactos — login por CPF (`SignInUseCase`) e busca por e-mail continuam usando índice único.
- Se, ao investigar, aparecer alguma query real filtrando pelas 3 colunas combinadas, **não remover** — reavaliar com o achado atualizado antes de aplicar esta task.

## Ver também

- [[Banco-de-Dados]]
- [[00-To-Do-Geral]]
- [[03 - Remover Indice Users Email Cpf Phone/To-Do|To-Do]]
