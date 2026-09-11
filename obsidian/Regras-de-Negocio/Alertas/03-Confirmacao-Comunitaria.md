---
title: Confirmação Comunitária
tags:
  - regra-de-negocio
  - alertas
  - confirmacao
  - reacoes
aliases:
  - Reações de Alerta
  - Alert Reactions
  - Confirmação por Quórum
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Confirmação Comunitária (Reações)

| | |
|---|---|
| **Domínio** | [[Alertas]] |
| **Caso de uso** | `CreateAlertReactionUseCase` |
| **Código-fonte** | `apps/api/src/domain/alerts/use-cases/create-alert-reaction.ts`, `apps/api/src/domain/alerts/policies/single-click-alert-confirmation.ts` |
| **Última atualização** | 2026-07-22 |

---

## 1. Visão Geral

Um alerta `PENDING` é confirmado pela comunidade por meio de reações do tipo `LIKE` ou `DISLIKE`. A confirmação (transição para `ACCEPTED`) segue uma árvore de decisão com três regras de prioridade — ver [[Regras-de-Negocio/Alertas/Canvas/Alertas - Fluxo de Confirmacao.canvas|mapa do fluxo de confirmação]].

## 2. Pré-condições (validadas antes de registrar a reação)

| # | Condição | Erro se falhar |
|---|---|---|
| 1 | Alerta precisa existir | `AlertNotFoundError` |
| 2 | Alerta precisa estar `PENDING` | `AlertNotOpenForReactionsError` |
| 3 | Se for alerta de saúde, usuário precisa ter permissão de visualização | `AlertNotFoundError` (mascarado, ver [[04-Visibilidade-Alertas-Saude]]) |
| 4 | Usuário não pode ter reagido antes a este alerta | `ReactionAlreadyExistsError` |

A checagem de duplicidade é por par `(alertId, authorId)` — um usuário só pode ter **uma** reação (de qualquer tipo) por alerta.

## 3. Regras de Aceite Automático

Após o registro da reação, avaliadas nesta ordem exata:

### 3.1 Papel não-membro (prioridade 1)

Se `currentUserRole !== "MEMBER"` (`LEADER`, `MANAGER` ou `ROOT`), o alerta é aceito imediatamente — **independentemente do tipo de reação**. Um `DISLIKE` de um líder também aceita o alerta.

### 3.2 Usuário coringa de confirmação única (prioridade 2)

Se o papel for `MEMBER`, a reação for `LIKE` e o `authorId` estiver na constante `SINGLE_CLICK_LIKE_CONFIRMS_ALERT_USER_IDS`, o alerta é aceito com um único `LIKE`.

> [!info] Conta de demonstração
> `SINGLE_CLICK_LIKE_CONFIRMS_ALERT_USER_IDS` contém hoje um único ID fixo (`a1b2c3d4-0006-4000-8000-000000000006`), documentado no próprio código como "membro coringa cujo único Sim (LIKE) confirma o alerta imediatamente" — usado para demonstrações comerciais/produto.

### 3.3 Confirmação por quórum (prioridade 3 — regra padrão)

Para os demais membros: o alerta é aceito quando o total acumulado de reações `LIKE` no alerta atinge `minimumToConfirm = 5`.

```
reactionTotalLikes = contagem de LIKE no alerta
se reactionTotalLikes >= 5:
    alerta.doAccept()
```

> [!warning] DISLIKE não rejeita
> Reações `DISLIKE` são persistidas normalmente, mas **não** reduzem a contagem de `LIKE` nem acionam qualquer rejeição. Não existe caminho de negócio que feche ou rejeite um alerta por acúmulo de `DISLIKE` — apenas o quórum positivo de `LIKE` importa para o aceite, e apenas a expiração por tempo (seção [[05-Expiracao-Automatica]]) encerra um alerta que não atinge o quórum.

## 4. Tabela-Resumo

| Papel do reagente | Tipo de reação | Resultado |
|---|---|---|
| `LEADER` / `MANAGER` / `ROOT` | `LIKE` ou `DISLIKE` | Aceita imediatamente |
| `MEMBER` (na lista coringa) | `LIKE` | Aceita imediatamente |
| `MEMBER` (na lista coringa) | `DISLIKE` | Reação registrada, sem aceite automático |
| `MEMBER` (comum) | `LIKE` | Reação registrada; aceita ao atingir 5 `LIKE` no total |
| `MEMBER` (comum) | `DISLIKE` | Reação registrada, sem qualquer efeito no status |

## Ver também

- [[Alertas]] — índice do domínio
- [[01-Ciclo-de-Vida]]
- [[04-Visibilidade-Alertas-Saude]]
- [[05-Expiracao-Automatica]]
- [[10-Erros-de-Dominio]]
- [[04-Dados-de-Referencia-e-Seeds]] — identidade do membro coringa (conta de seed)
