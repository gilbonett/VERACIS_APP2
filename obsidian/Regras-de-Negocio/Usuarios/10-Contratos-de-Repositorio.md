---
title: Contratos de Repositório - Usuários
tags:
  - regra-de-negocio
  - usuarios
  - repositorios
  - arquitetura
aliases:
  - User Repositories
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Contratos de Repositório

| | |
|---|---|
| **Domínio** | [[Usuarios]] |
| **Código-fonte** | `apps/api/src/domain/users/repositories/` |
| **Última atualização** | 2026-07-22 |

---

## 1. Princípio Arquitetural

Seguindo [[Geral|VERACIS]] (seção 3), nenhum caso de uso deste domínio acessa o Prisma diretamente — todos os contratos abaixo são interfaces abstratas implementadas pela infraestrutura.

## 2. Catálogo de Repositórios

| Repositório | Responsabilidade | Métodos-chave |
|---|---|---|
| `UserRepository` | CRUD do aggregate `User` | `create`, `save`, `findById`, `findByCpf`, `findByEmail`, `updatePassword`, `invalidateProfileCache` |
| `MembershipRepository` | Vínculo usuário-comunidade | `findManyByCommunityId`, `findManyByCommunityIdsAndLeader`, `findCountByCommunityId`, `createMany`, `removeMany` |
| `UserTermsRepository` | Registro de aceite de termos | `create` (único método) |

## 3. Ausência Notável: `TermsRepository`

Não existe um contrato de repositório para a entidade `Terms` (o documento em si) — apenas para `UserTerms` (o aceite). Ver [[06-Termos-de-Uso]] para o detalhe da lacuna.

## 4. Métodos Sem Chamador Conhecido

| Método | Repositório | Observação |
|---|---|---|
| `findCountByCommunityId` | `MembershipRepository` | Declarado no contrato, nenhum caso de uso o invoca em `apps/api/src` |

## Ver também

- [[Usuarios]] — índice do domínio
- [[05-Vinculo-com-Comunidades]]
- [[06-Termos-de-Uso]]
