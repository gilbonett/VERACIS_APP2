---
title: Remover ou formalizar findByPhone
tags:
  - database
  - performance
  - manutencao
  - baixa-prioridade
aliases:
  - Task 14
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Remover ou formalizar `findByPhone`

| | |
|---|---|
| **Impacto** | Baixo (manutenção) |
| **Esforço** | Baixo |
| **Fonte** | [[Indices-Redundantes-ou-Nao-Utilizados]] §3 |

---

## O que precisa ser feito

`PrismaUserRepository.findByPhone` (`apps/api/src/infra/database/prisma/users/repositories/prisma-user-repository.ts:41`) não está no contrato abstrato `UserRepository` e não tem nenhum chamador no código — é código morto.

## Como fazer

Confirmar com o time se login/lookup por telefone é uma funcionalidade planejada:

- **Se não for planejada**: remover o método de `PrismaUserRepository`.
- **Se for planejada**: declarar `findByPhone` no contrato abstrato `UserRepository`, criar índice dedicado (`CREATE INDEX users_phone_idx ON users (phone);`) e escrever o use-case que de fato o consome — não deixar implementação órfã sem contrato nem chamador.

## Como deve ficar o resultado

- `grep -rn "findByPhone" apps/api/src` retorna, no mínimo, uma declaração no contrato **e** um chamador real — ou não retorna nada (método removido).
- Nenhuma implementação de repositório existe sem estar no contrato abstrato correspondente e sem ser usada por pelo menos um caso de uso.

## Ver também

- [[Banco-de-Dados]]
- [[00-To-Do-Geral]]
- [[14 - Remover FindByPhone/To-Do|To-Do]]
