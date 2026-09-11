---
title: Erros de Domínio - Usuários
tags:
  - regra-de-negocio
  - usuarios
  - erros
aliases:
  - User Domain Errors
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Erros de Domínio

| | |
|---|---|
| **Domínio** | [[Usuarios]] |
| **Código-fonte** | `apps/api/src/domain/users/errors/` |
| **Última atualização** | 2026-07-22 |

---

## 1. Catálogo — Em Uso

| Erro | Mensagem (pt-BR) | Quando ocorre | Regra relacionada |
|---|---|---|---|
| `UserNotFoundError` | "Não encontramos uma conta com esses dados." | Usuário não encontrado (perfil, senha, tutorial, busca administrativa) | [[03-Perfil-e-Conta]], [[07-Administracao-de-Usuarios]] |
| `UserAlreadyExistsError` | "Já existe uma conta com este CPF ou e-mail." | Cadastro com CPF/e-mail já usados, ou atualização de perfil para um e-mail já em uso | [[02-Registro-de-Usuario]], [[03-Perfil-e-Conta]] |
| `InvalidCurrentPasswordError` | "A senha atual está incorreta. Verifique e tente novamente." | Senha atual não confere, ou usuário não possui senha definida, na troca de senha | [[03-Perfil-e-Conta]] |
| `OtpAlreadyEnabledError` | "A verificação em duas etapas já está ativada." | Tentativa de ativar OTP já ativado | [[04-Autenticacao-em-Duas-Etapas]] |
| `NotAuthorizedError` | "Você não tem permissão para fazer isso." | Papel do solicitante fora de `MANAGER`/`ROOT` em consultas administrativas | [[07-Administracao-de-Usuarios]] |

## 2. Catálogo — Definidos, Nunca Lançados

| Erro | Mensagem (pt-BR) | Por que existe sem uso | Regra relacionada |
|---|---|---|---|
| `AccountAlreadyActiveError` | "Sua conta já está ativa." | Par de um caso de uso "ativar conta" que não foi implementado | [[01-Ciclo-de-Vida-da-Conta]] |
| `AccountAlreadyDisabledError` | "Sua conta já está desativada." | Par de um caso de uso "desativar conta" que não foi implementado | [[01-Ciclo-de-Vida-da-Conta]] |
| `OtpAlreadyDisabledError` | "A verificação em duas etapas já está desativada." | Par de `DisableOtpUseCase`, que não existe | [[04-Autenticacao-em-Duas-Etapas]] |

> [!info] Sinal de intenção, não de bug
> Os três erros da segunda tabela não são inconsistências — são a evidência de que o domínio foi desenhado prevendo ativação/desativação de conta e desativação de OTP, mas a implementação dos casos de uso correspondentes ficou pendente. Útil como checklist para quem for implementar essas funcionalidades: os erros já existem, só falta o caso de uso que os lança.

## 3. Convenção

Todos os erros implementam `UseCaseError` (não `DomainError`, como no domínio de Alertas — nomenclatura de interface diverge entre subdomínios) e estendem `Error`, com mensagens em português voltadas ao usuário final.

## Ver também

- [[Usuarios]] — índice do domínio
- [[01-Ciclo-de-Vida-da-Conta]]
- [[04-Autenticacao-em-Duas-Etapas]]
