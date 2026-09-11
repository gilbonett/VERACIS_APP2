---
title: Ciclo de Vida da Conta
tags:
  - regra-de-negocio
  - usuarios
  - ciclo-de-vida
aliases:
  - Account Lifecycle
  - Status do Usuário
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Ciclo de Vida da Conta

| | |
|---|---|
| **Domínio** | [[Usuarios]] |
| **Código-fonte** | `apps/api/src/domain/users/entities/user.ts` |
| **Última atualização** | 2026-07-22 |

---

## 1. Estados

```ts
type UserStatus = "ACTIVED" | "DISABLED" | "BLOCKED";
```

| Status | Significado |
|---|---|
| `ACTIVED` | Conta ativa e utilizável — status atribuído a toda conta no momento do cadastro |
| `DISABLED` | Conta desativada. Método `disable()` existe na entidade |
| `BLOCKED` | Conta bloqueada. Declarado no tipo, sem nenhum método ou fluxo associado |

## 2. O Que Está Realmente Implementado

> [!warning] Ciclo de vida quase todo inerte
> Uma busca por chamadas a `.disable()` e `.activate()` em todo `apps/api/src` retorna apenas as próprias definições dos métodos em `user.ts` — **nenhum caso de uso do domínio os invoca**. O mesmo vale para `BLOCKED`: o valor existe no tipo `UserStatus`, mas nenhum trecho de código o atribui.
>
> Na prática, hoje toda conta nasce e permanece `ACTIVED` dentro deste domínio. Se existe bloqueio ou desativação de conta em produção, ele acontece fora de `domain/users` (por exemplo, na camada de autenticação/autorização) e não está documentado aqui.

Os erros `AccountAlreadyActiveError` e `AccountAlreadyDisabledError` também existem e nunca são lançados — reforçam a leitura de que um fluxo de ativação/desativação foi modelado, mas nunca finalizado com um caso de uso. Ver [[09-Erros-de-Dominio]].

## 3. Outros Métodos Sem Chamador

Pelo mesmo padrão, os seguintes métodos da entidade `User` não têm nenhum caso de uso que os invoque hoje:

| Método | Efeito pretendido | Situação |
|---|---|---|
| `markEmailVerified()` | Marca `isVerified = true` | Nunca chamado — `isVerified` já nasce `true` na criação (ver [[02-Registro-de-Usuario]]), o que o torna redundante no fluxo atual |
| `recordSignIn()` | Atualiza `lastSignInAt` | Nunca chamado neste domínio — se o login registra o último acesso, isso acontece em outro domínio (autenticação) |

## 4. Antes de Assumir um Fluxo de Bloqueio

Se uma nova funcionalidade depender de "conta desativada" ou "conta bloqueada" (por exemplo, impedir login), confirme com o time se a regra deve ser implementada aqui pela primeira vez ou se já existe fora deste subdomínio — não assuma que o enum `UserStatus` reflete um fluxo funcional hoje.

## Ver também

- [[Usuarios]] — índice do domínio
- [[09-Erros-de-Dominio]]
- [[13-Requisitos]]
