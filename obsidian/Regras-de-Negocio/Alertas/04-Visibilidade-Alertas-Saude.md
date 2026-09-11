---
title: Visibilidade de Alertas de Saúde
tags:
  - regra-de-negocio
  - alertas
  - visibilidade
  - saude
  - privacidade
aliases:
  - Health Alert Visibility
  - Privacidade de Alertas de Saúde
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Visibilidade de Alertas de Saúde

| | |
|---|---|
| **Domínio** | [[Alertas]] |
| **Política** | `health-alert-visibility.ts` |
| **Código-fonte** | `apps/api/src/domain/alerts/policies/health-alert-visibility.ts` |
| **Aplicada em** | `GetAlertByIdUseCase`, `GetAlertsUseCase`, `CreateAlertCommentUseCase`, `CreateAlertReactionUseCase` |
| **Última atualização** | 2026-07-22 |

---

## 1. Definição de Alerta de Saúde

Um alerta é considerado **alerta de saúde** se qualquer um dos seus eventos associados pertencer à categoria fixa:

```
HEALTH_ALERT_CATEGORY_ID = "b1b2c3d4-0004-4000-8000-000000000004"
```

```ts
function isHealthAlert(alert) {
  return alert.events.some(e => e.categoryId === HEALTH_ALERT_CATEGORY_ID);
}
```

## 2. Quem Pode Ver

| Perfil | Vê alerta de saúde? |
|---|---|
| Autor do alerta | Sempre |
| `LEADER` | Sempre, mesmo não sendo autor |
| `MANAGER` / `ROOT` | Sempre, mesmo não sendo autor |
| `MEMBER` que não é o autor | **Não** |

Alertas que **não** são de saúde seguem a visibilidade padrão da comunidade — sem restrição adicional.

## 3. Onde a Regra é Aplicada

| Fluxo | Efeito quando negado |
|---|---|
| Listagem de alertas (`GetAlertsUseCase`) | O item é removido do array de resultados (`filterAlertsByHealthVisibility`) |
| Busca por ID (`GetAlertByIdUseCase`) | Retorna `AlertNotFoundError` |
| Criar comentário (`CreateAlertCommentUseCase`) | Retorna `AlertNotFoundError` |
| Criar reação (`CreateAlertReactionUseCase`) | Retorna `AlertNotFoundError` |

> [!important] Mascaramento de existência
> Em todos os fluxos de acesso individual, a negação retorna o mesmo erro de "não encontrado" (`AlertNotFoundError`) usado para um alerta que de fato não existe — nunca um erro de permissão (`403`/`Forbidden`). Isso evita que um usuário sem acesso deduza, pela resposta da API, que um alerta de saúde existe para determinado autor.

## 4. Casos de Teste Cobertos (`health-alert-visibility.spec.ts`)

- Membro vê o próprio alerta de saúde.
- Membro não vê alerta de saúde de outro usuário.
- Líder vê alerta de saúde de outro usuário.
- Alertas de outras categorias permanecem visíveis para membros, independentemente do autor.
- `filterAlertsByHealthVisibility` remove corretamente os alertas de saúde não autorizados de uma lista mista.

## Ver também

- [[Alertas]] — índice do domínio
- [[03-Confirmacao-Comunitaria]]
- [[06-Comentarios]]
- [[09-Consulta-de-Alertas]]
- [[04-Dados-de-Referencia-e-Seeds]] — origem do ID fixo da categoria Saúde
