---
title: Registro de Usuário
tags:
  - regra-de-negocio
  - usuarios
  - registro
  - cadastro
aliases:
  - Register User
  - Cadastro de Usuário
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Registro de Usuário

| | |
|---|---|
| **Domínio** | [[Usuarios]] |
| **Caso de uso** | `RegisterUserUseCase` |
| **Código-fonte** | `apps/api/src/domain/users/use-cases/register-user.use-case.ts`, `apps/api/src/domain/users/entities/user.ts` (`User.create`) |
| **Última atualização** | 2026-07-22 |

---

## 1. Unicidade

Antes de criar a conta, o caso de uso verifica em paralelo se já existe usuário com o mesmo CPF **ou** o mesmo e-mail:

```ts
const [existingByCpf, existingByEmail] = await Promise.all([
  userRepository.findByCpf(data.cpf),
  userRepository.findByEmail(data.email),
]);

if (existingByCpf || existingByEmail) return left(new UserAlreadyExistsError());
```

Se qualquer um dos dois existir, o cadastro é recusado com `UserAlreadyExistsError` — a mensagem não distingue qual dos dois campos colidiu.

## 2. Campos e Valores Padrão na Criação

| Campo | Origem | Observação |
|---|---|---|
| `password` | Hash gerado pelo caso de uso (`HashGenerator`) | Nunca armazenado em texto plano |
| `status` | Sempre `"ACTIVED"` | Ver [[01-Ciclo-de-Vida-da-Conta]] |
| `isVerified` | Sempre `true` | Conta nasce verificada — não há fluxo de verificação de e-mail pós-cadastro neste domínio |
| `otpEnabled` | `true` na entidade (`User.create`), mas o caso de uso chama `user.disableOtp()` logo em seguida | Ver seção 3 |
| `communities` | Construída a partir de `communityIds` via `aggreateCommunities()` | Toda conta nasce vinculada às comunidades informadas no cadastro |

## 3. Nuance: OTP Nasce Ligado, Mas é Desligado na Mesma Operação

> [!warning] Comportamento efetivo: toda conta nova começa com OTP desativado
> `User.create()` define `otpEnabled: true` por padrão na entidade. Porém, imediatamente após criar o usuário, `RegisterUserUseCase.execute()` chama `user.disableOtp()` antes de persistir. O efeito líquido observável é que **toda conta recém-cadastrada é salva com `otpEnabled = false`**, apesar do valor padrão da entidade sugerir o contrário.
>
> Isso é comportamento atual do código, não necessariamente a intenção original — o padrão `true` na entidade pode ser vestígio de um fluxo anterior. Ver [[04-Autenticacao-em-Duas-Etapas]].

## 4. Eventos Disparados

`User.create()` sempre dispara dois eventos e condicionalmente um terceiro:

| Evento | Condição |
|---|---|
| `UserRegistered` | Sempre |
| `UserTermsAcceptedEvent` | Sempre — registra o aceite do `termsId` informado no cadastro |
| `UserCreatedEvent` | Apenas se `role === "MEMBER"` |

Ver [[08-Eventos-de-Dominio]] para o efeito de cada um.

## 5. Vínculo com Comunidades no Cadastro

`communityIds` é obrigatório no payload de criação (`CreateProfileData`). `aggreateCommunities()` substitui a lista inteira de comunidades do usuário — não há fluxo de adicionar uma comunidade a um usuário já existente dentro deste caso de uso. Ver [[05-Vinculo-com-Comunidades]].

## Ver também

- [[Usuarios]] — índice do domínio
- [[04-Autenticacao-em-Duas-Etapas]]
- [[05-Vinculo-com-Comunidades]]
- [[06-Termos-de-Uso]]
- [[08-Eventos-de-Dominio]]
