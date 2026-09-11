---
title: Comentários em Alertas
tags:
  - regra-de-negocio
  - alertas
  - comentarios
aliases:
  - Alert Comments
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Comentários

| | |
|---|---|
| **Domínio** | [[Alertas]] |
| **Caso de uso** | `CreateAlertCommentUseCase` |
| **Código-fonte** | `apps/api/src/domain/alerts/use-cases/create-alert-comment.ts`, `apps/api/src/domain/alerts/entities/alert-comment.ts` |
| **Última atualização** | 2026-07-22 |

---

## 1. Regras

- O alerta precisa existir — consultado via `AlertDetailsRepository` (read model), não via `AlertRepository` de escrita.
- **Não há restrição de status**: é possível comentar em alertas `PENDING`, `ACCEPTED`, `REJECTED` ou `CLOSED`. Diferente das reações (ver [[03-Confirmacao-Comunitaria]]), que só são aceitas com o alerta `PENDING`.
- Aplica-se a regra de visibilidade de alertas de saúde ([[04-Visibilidade-Alertas-Saude]]): se o usuário não pode ver o alerta, o comentário é recusado com `AlertNotFoundError`.
- Todo comentário tem `content`, `authorId`, `alertId`, `createdAt` e `updatedAt` — os timestamps são preenchidos automaticamente na criação se não informados.

## 2. Limitações do Modelo Atual

- Não há edição de comentários — a entidade `AlertComment` não expõe nenhum método de mutação além da criação.
- Não há remoção de comentários no domínio.
- Não há paginação, moderação ou limite de tamanho de conteúdo modelados no domínio — se existirem, estão na camada de apresentação/infraestrutura, fora deste subdomínio.

## Ver também

- [[Alertas]] — índice do domínio
- [[04-Visibilidade-Alertas-Saude]]
- [[09-Consulta-de-Alertas]]
