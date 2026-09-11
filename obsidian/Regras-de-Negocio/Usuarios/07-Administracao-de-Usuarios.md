---
title: Administração de Usuários
tags:
  - regra-de-negocio
  - usuarios
  - administracao
  - autorizacao
aliases:
  - User Administration
  - Listagem de Usuários
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Administração de Usuários

| | |
|---|---|
| **Domínio** | [[Usuarios]] |
| **Casos de uso** | `GetUserByIdUseCase`, `ListUsersUseCase` |
| **Código-fonte** | `apps/api/src/domain/users/use-cases/get-user-by-id.use-case.ts`, `list-users.use-case.ts` |
| **Última atualização** | 2026-07-22 |

---

## 1. Regra de Autorização

Ambos os casos de uso restringem o acesso ao mesmo conjunto de papéis:

```ts
const ALLOWED_ROLES: UserRole[] = ["MANAGER", "ROOT"];
```

- `LEADER` e `MEMBER` **não** podem consultar outro usuário por ID nem listar todos os usuários — recusados com `NotAuthorizedError`.
- A checagem é feita antes de qualquer acesso ao repositório — nenhuma consulta é executada se o papel do solicitante não estiver na lista.

## 2. `GetUserByIdUseCase`

- Requer `targetUserId` e `requesterRole`.
- Após passar na checagem de papel, busca o usuário; se não existir, `UserNotFoundError`.

## 3. `ListUsersUseCase`

- Requer apenas `requesterRole`.
- Retorna **todos** os usuários (`userRepository.findAll()`) — não há paginação, filtro por comunidade ou por status implementado no caso de uso hoje. Há um bloco de código comentado sugerindo filtros futuros (`ListUsersFilters`, `PaginatedResult`), ainda não implementado.

## 4. Contraste com Outras Consultas do Domínio

Diferente de `GetUserIdsByCommunityIdUseCase` ([[05-Vinculo-com-Comunidades]]), que não tem nenhuma checagem de papel, estes dois casos de uso são os únicos do domínio de Usuários com controle de autorização explícito — a diferença reforça que `GetUserIdsByCommunityIdUseCase` é pensado para consumo interno/serviço-a-serviço, não para exposição direta a um usuário final sem outra camada de autorização.

## Ver também

- [[Usuarios]] — índice do domínio
- [[05-Vinculo-com-Comunidades]]
- [[09-Erros-de-Dominio]]
