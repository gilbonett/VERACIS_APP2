---
title: Vínculo com Comunidades
tags:
  - regra-de-negocio
  - usuarios
  - comunidades
  - membership
aliases:
  - Membership
  - Vínculo Usuário-Comunidade
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Vínculo com Comunidades

| | |
|---|---|
| **Domínio** | [[Usuarios]] |
| **Entidade** | `Membership` |
| **Código-fonte** | `apps/api/src/domain/users/entities/membership.ts`, `user-membership-list.ts`, `repositories/membership-repository.ts` |
| **Última atualização** | 2026-07-22 |

---

## 1. Modelo

`Membership` liga um `userId` a um `communityId`. Um usuário pode ter múltiplos vínculos (`UserMembershipList`, uma `WatchedList` que compara itens por `communityId`) — ou seja, um usuário pode pertencer a mais de uma comunidade simultaneamente.

`communityName` e `biomeName` são opcionais na entidade — presentes apenas quando o `Membership` é reconstituído a partir de uma leitura desnormalizada (join), ausentes quando criado no fluxo de escrita (`Membership.create`).

## 2. Criação de Vínculos

`User.aggreateCommunities(communityIds)` (chamado por `User.create()`, ver [[02-Registro-de-Usuario]]) substitui **toda** a lista de comunidades do usuário pelos IDs informados — não é uma operação de adição incremental. Fora do fluxo de registro, não há caso de uso neste domínio para adicionar ou remover uma comunidade de um usuário já existente.

## 3. Consultas Suportadas pelo Repositório

| Método | Uso conhecido |
|---|---|
| `findManyByCommunityId(communityId)` | `GetUserIdsByCommunityIdUseCase` (seção 4) |
| `findManyByCommunityIdsAndLeader(communityIds)` | Consumido **fora deste domínio**, por `OnUserCreated` em `domain/notifications` — busca os líderes das comunidades de um novo membro para notificá-los |
| `findCountByCommunityId(communityId)` | Declarado no contrato, sem nenhum chamador encontrado em `apps/api/src` |
| `createMany` / `removeMany` | Operações em lote de associação/remoção |

## 4. Listar IDs de Usuários por Comunidade

`GetUserIdsByCommunityIdUseCase` retorna a lista de `userId` de todos os vínculos de uma comunidade — sem checagem de papel/permissão do solicitante, diferente de [[07-Administracao-de-Usuarios]]. É um caso de uso simples de leitura, provavelmente pensado para consumo interno (por exemplo, broadcast de notificações), não exposto diretamente a um usuário final sem outra camada de autorização.

## 5. Efeito Colateral no Ingresso de um `MEMBER`

Quando um `MEMBER` se cadastra vinculado a uma ou mais comunidades, `UserCreatedEvent` é disparado (ver [[02-Registro-de-Usuario]], [[08-Eventos-de-Dominio]]) e o domínio de notificações usa `findManyByCommunityIdsAndLeader` para avisar os líderes de cada comunidade: "**Novo Membro na Comunidade** — {nome} acaba de entrar na sua comunidade." Esse efeito só ocorre para `MEMBER`; usuários criados como `LEADER`, `MANAGER` ou `ROOT` não geram essa notificação.

## Ver também

- [[Usuarios]] — índice do domínio
- [[02-Registro-de-Usuario]]
- [[07-Administracao-de-Usuarios]]
- [[08-Eventos-de-Dominio]]
- [[10-Contratos-de-Repositorio]]
- [[Comunidades]] — o domínio do outro lado do vínculo
