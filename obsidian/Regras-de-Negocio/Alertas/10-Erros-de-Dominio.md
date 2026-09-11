---
title: Erros de Domínio - Alertas
tags:
  - regra-de-negocio
  - alertas
  - erros
aliases:
  - Alert Domain Errors
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Erros de Domínio

| | |
|---|---|
| **Domínio** | [[Alertas]] |
| **Código-fonte** | `apps/api/src/domain/alerts/errors/` |
| **Última atualização** | 2026-07-22 |

---

## 1. Catálogo

| Erro | Mensagem (pt-BR) | Quando ocorre | Regra relacionada |
|---|---|---|---|
| `AlertNotFoundError` | "Não encontramos este alerta." | Alerta inexistente, ou oculto por regra de visibilidade de saúde | [[04-Visibilidade-Alertas-Saude]] |
| `AlertNotPendingError` | "Este alerta não está mais em análise." | Job de expiração de pendente dispara para alerta que já saiu de `PENDING` | [[05-Expiracao-Automatica]] |
| `AlertNotAcceptedError` | "Este alerta ainda não foi aceito pela comunidade." | Job de expiração de aceito dispara para alerta que já saiu de `ACCEPTED` | [[05-Expiracao-Automatica]] |
| `AlertNotOpenForReactionsError` | "Este alerta não aceita mais confirmações." | Reação enviada para alerta que não está `PENDING` | [[03-Confirmacao-Comunitaria]] |
| `ReactionAlreadyExistsError` | "Você já confirmou este alerta." | Usuário tenta reagir duas vezes ao mesmo alerta | [[03-Confirmacao-Comunitaria]] |

## 2. Convenção

Todos os erros implementam a interface `DomainError` e estendem `Error`, com mensagens já em português voltadas ao usuário final (não mensagens técnicas de debug) — refletindo a política do VERACIS de manter mensagens de domínio prontas para exibição direta na UI.

Todos os casos de uso do domínio retornam esses erros via `Either<Error, Success>` (padrão funcional adotado em todo o projeto, ver `@/core/either`), nunca lançando exceção diretamente para o fluxo de negócio esperado.

## Ver também

- [[Alertas]] — índice do domínio
- [[01-Ciclo-de-Vida]]
- [[03-Confirmacao-Comunitaria]]
- [[05-Expiracao-Automatica]]
