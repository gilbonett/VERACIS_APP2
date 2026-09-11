---
title: Eventos de Domínio - Usuários
tags:
  - regra-de-negocio
  - usuarios
  - eventos
  - domain-events
aliases:
  - User Domain Events
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Eventos de Domínio

| | |
|---|---|
| **Domínio** | [[Usuarios]] |
| **Código-fonte** | `apps/api/src/domain/users/events/`, `apps/api/src/domain/users/subscribers/` |
| **Última atualização** | 2026-07-22 |

---

## 1. Catálogo

| Evento | Disparado em | Condição | Consumido por |
|---|---|---|---|
| `UserRegistered` | `User.create()` | Sempre | `OnUserRegistered` (dispara e-mail de boas-vindas) |
| `UserTermsAcceptedEvent` | `User.create()` | Sempre | `OnUserTermsAccepted` (persiste `UserTerms`) |
| `UserCreatedEvent` | `User.create()` | Apenas se `role === "MEMBER"` | `OnUserCreated`, em `domain/notifications` (notifica líderes das comunidades) |
| `UserMfaStateChanged` | Nunca — referenciado apenas em comentário dentro de `EnableOtpUseCase`, arquivo de definição não existe | — | — |

## 2. Métodos de Handler com Nome Trocado

> [!warning] `sendPasswordResetEmail` não envia e-mail de redefinição de senha em nenhum dos dois casos
> Tanto `OnUserRegistered` quanto `OnUserTermsAccepted` nomeiam seu método interno de tratamento como `sendPasswordResetEmail`, mas:
> - Em `OnUserRegistered`, o método na verdade despacha o **e-mail de boas-vindas** (`dispatcher.dispatchWelcome(email, name)`).
> - Em `OnUserTermsAccepted`, o método na verdade **persiste o registro de aceite do termo** (`UserTerms.create(...)`) — não envia e-mail algum.
>
> Funcionalmente inofensivo (o nome do método é privado e não afeta comportamento), mas confunde leitura e manutenção — vale corrigir na próxima vez que qualquer um dos dois arquivos for tocado.

## 3. `UserCreatedEvent`: Only for `MEMBER`

Ver [[05-Vinculo-com-Comunidades]] (seção 5) para o efeito completo: apenas o cadastro de um `MEMBER` gera a notificação "Novo Membro na Comunidade" aos líderes. Cadastros com papel `LEADER`, `MANAGER` ou `ROOT` não disparam esse evento — não há como saber, apenas lendo `UserRegistered` ou `UserTermsAcceptedEvent`, que uma conta de liderança acabou de ser criada.

## 4. `UserMfaStateChanged`: Evento Fantasma

Diferente de `AlertAcceptedEvent` no domínio de Alertas (que existe como classe, mas está com o disparo comentado — ver [[11-Eventos-de-Dominio|Eventos de Domínio - Alertas]]), `UserMfaStateChanged` **nem chegou a ser definido**: não há arquivo `user-mfa-state-changed-event.ts` em `domain/users/events/`. A linha comentada em `EnableOtpUseCase` referencia uma classe que não existe no código-fonte atual. Ver [[04-Autenticacao-em-Duas-Etapas]].

## Ver também

- [[Usuarios]] — índice do domínio
- [[02-Registro-de-Usuario]]
- [[04-Autenticacao-em-Duas-Etapas]]
- [[05-Vinculo-com-Comunidades]]
- [[06-Termos-de-Uso]]
