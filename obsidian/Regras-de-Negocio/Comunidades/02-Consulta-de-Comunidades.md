---
title: Consulta de Comunidades
tags:
  - regra-de-negocio
  - comunidades
  - consulta
  - visitante
aliases:
  - Get Communities
  - Listagem de Comunidades
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Consulta de Comunidades

| | |
|---|---|
| **Domínio** | [[Comunidades]] |
| **Caso de uso** | `GetCommunitiesUseCase` |
| **Código-fonte** | `apps/api/src/domain/communities/use-cases/get-communities-use-case.ts`, `apps/api/src/infra/http/controllers/communities/get-communities.controller.ts` |
| **Última atualização** | 2026-07-22 |

---

## 1. Regras

- Lista todas as comunidades, com filtro opcional por bioma (`biomeId`).
- Ordenação fixa por nome ascendente (definida na implementação Prisma do repositório).
- Não há paginação — o conjunto de comunidades é pequeno e de referência, a listagem retorna tudo.
- Nenhum erro de negócio é possível: sem filtro inválido, sem caso "não encontrado" — lista vazia é resposta válida.

## 2. Endpoint Público (Acesso de Visitante)

O controller `GET /communities` é anotado com `@Public()` — **é acessível sem autenticação**. Este é o único endpoint público do domínio e conecta-se ao conceito de **Visitante** do glossário geral ([[Geral]] §14): usuários não autenticados podem ver a lista de comunidades (por exemplo, na tela de cadastro, para escolher a comunidade de vínculo antes de ter conta — ver [[02-Registro-de-Usuario]]).

Os endpoints de eventos ([[03-Eventos]]) **não** são públicos — exigem autenticação.

## 3. Divergências de Padrão (Registradas)

- `GetCommunitiesUseCase.execute()` retorna `Community[]` cru, sem o envelope `Either<never, T>` usado no restante do projeto — inconsistência inofensiva, mas quebra a uniformidade que [[Geral]] §3 pede.
- O controller tem dois typos: classe `GetCommuntiesController` (falta o "i" de "Communities") e variável `resuls`. Não afetam runtime (o nome da classe não é rota), mas atrapalham busca por símbolo — corrigir na próxima passagem por esse arquivo.

## Ver também

- [[Comunidades]] — índice do domínio
- [[01-Modelo-e-Conceitos]]
- [[06-Contratos-de-Repositorio]]
- [[02-Registro-de-Usuario]] — consumo do `communityId` no cadastro
