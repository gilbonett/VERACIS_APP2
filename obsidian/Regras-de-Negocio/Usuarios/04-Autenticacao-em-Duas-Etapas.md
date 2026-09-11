---
title: Autenticação em Duas Etapas (OTP)
tags:
  - regra-de-negocio
  - usuarios
  - otp
  - mfa
  - seguranca
aliases:
  - OTP
  - MFA
  - Two-Factor Authentication
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Autenticação em Duas Etapas (OTP)

| | |
|---|---|
| **Domínio** | [[Usuarios]] |
| **Caso de uso** | `EnableOtpUseCase` |
| **Código-fonte** | `apps/api/src/domain/users/use-cases/enable-otp.use-case.ts` |
| **Última atualização** | 2026-07-22 |

---

## 1. Estado Inicial

Toda conta nova é persistida com `otpEnabled = false`, como consequência do fluxo de registro — ver [[02-Registro-de-Usuario]] (seção 3).

## 2. Ativação

`EnableOtpUseCase`:

- Exige que o usuário exista (`UserNotFoundError`).
- Recusa ativar OTP já ativado (`OtpAlreadyEnabledError`).
- Se passar nas duas checagens, chama `user.enableOtp()` e persiste.

## 3. Lacuna: Não Existe Desativação

> [!danger] `DisableOtpUseCase` não existe
> A entidade `User` tem `disableOtp()` (usado internamente pelo fluxo de registro, ver [[02-Registro-de-Usuario]]), e o erro `OtpAlreadyDisabledError` está definido — mas não há nenhum caso de uso público que permita a um usuário desativar o OTP depois de ativado. O par simétrico de `EnableOtpUseCase` simplesmente não foi implementado.
>
> Isso significa que, hoje, uma vez ativado o OTP pelo fluxo existente, não há caminho no domínio de Usuários para desfazer essa ativação.

## 4. Evento de Domínio Não Emitido

`EnableOtpUseCase` contém a linha comentada:

```ts
// user.addDomainEvent(new UserMfaStateChanged(user.id, true));
```

Não existe sequer o arquivo de definição de `UserMfaStateChanged` — diferente do padrão visto em [[Alertas|Alertas]] (`AlertAcceptedEvent`), aqui o evento nunca chegou a ser criado, apenas referenciado em comentário. Nenhum consumidor reage à ativação de OTP hoje.

## Ver também

- [[Usuarios]] — índice do domínio
- [[02-Registro-de-Usuario]]
- [[08-Eventos-de-Dominio]]
- [[09-Erros-de-Dominio]]
