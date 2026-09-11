---
title: Perfil e Conta
tags:
  - regra-de-negocio
  - usuarios
  - perfil
  - senha
aliases:
  - Profile Management
  - Perfil do Usuário
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Perfil e Conta

| | |
|---|---|
| **Domínio** | [[Usuarios]] |
| **Casos de uso** | `GetProfileUseCase`, `UpdateProfileUseCase`, `ChangePasswordUseCase`, `CompleteMapTutorialUseCase` |
| **Código-fonte** | `apps/api/src/domain/users/use-cases/get-profile.use-case.ts`, `update-profile.use-case.ts`, `change-password.use-case.ts`, `complete-map-tutorial.use-case.ts` |
| **Última atualização** | 2026-07-22 |

---

## 1. Consulta de Perfil (`GetProfileUseCase`)

Antes de buscar o usuário, o caso de uso **invalida o cache de perfil** (`invalidateProfileCache(userId)`) e só então lê os dados (`findById`). Isso garante que toda leitura de perfil retorne dado fresco, ao custo de nunca se beneficiar de cache — uma troca deliberada de consistência sobre desempenho para esta consulta específica.

## 2. Atualização de Perfil (`UpdateProfileUseCase`)

- Campos atualizáveis: `name`, `email`, `phone`, `emailRecovery`, `avatarUrl` — todos opcionais, só o que for enviado é alterado (`updateProfile()` só atribui campos `!== undefined`).
- Se `email` for alterado para um valor diferente do atual, o caso de uso verifica unicidade (`findByEmail`) e recusa com `UserAlreadyExistsError` se já pertencer a outra conta. Não há essa mesma checagem para CPF nesta atualização — `cpf` não está entre os campos editáveis.
- Toda atualização atualiza `updatedAt`.

## 3. Troca de Senha (`ChangePasswordUseCase`)

- Exige `currentPassword` e `newPassword`.
- Se o usuário não tiver senha definida (`user.password` nulo/ausente), a troca é recusada com `InvalidCurrentPasswordError` — mesmo erro usado para senha incorreta, não distingue "sem senha" de "senha errada".
- A senha atual é validada por comparação de hash (`HashComparer`) antes de gerar e persistir o novo hash.
- A persistência da nova senha usa `userRepository.updatePassword(userId, hash)` — um método dedicado do repositório, não o `save()` genérico do aggregate.

## 4. Tutorial do Mapa (`CompleteMapTutorialUseCase`)

- `completeMapTutorial()` é idempotente: se `hasCompletedMapTutorial` já for verdadeiro (`mapTutorialCompletedAt` não nulo), a chamada retorna sem efeito — não sobrescreve a data original de conclusão.
- Não há forma de "reabrir" o tutorial — uma vez completado, permanece completado.

## Ver também

- [[Usuarios]] — índice do domínio
- [[02-Registro-de-Usuario]]
- [[09-Erros-de-Dominio]]
