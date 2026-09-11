---
title: Task 11 - Unificar definição de alerta de saúde
tags:
  - alerts
  - ddd
  - task
severidade: Média
esforco: Médio
fase: 2
status: pendente
---

#alerts #ddd #task

# Task 11 — Unificar definição de "alerta de saúde"

> Origem: [[06 - Duplicidades e Reuso#D3 — Política de visibilidade com 2 variantes paralelas|D3]] · TODO geral: [[00 - TODO Geral]]

## O que fazer

`domain/alerts/policies/health-alert-visibility.ts` tem duas definições **divergentes** de alerta de saúde:

- `canViewHealthAlert` / `isHealthAlert`: saúde se **algum evento** tem `categoryId` de saúde (usado em get-by-id, comments, listagem);
- `canViewHealthAlertByCategory`: saúde se o **categoryId do alerta** é de saúde (usado em reactions).

Alerta de categoria X contendo evento de saúde (ou vice-versa): comentário pode ser bloqueado enquanto reação passa, ou o inverso. Privacidade de saúde com comportamento dependente do caminho de código.

## Como fazer

1. **Decidir com o time a fonte de verdade** (checar `Regras-de-Negocio/Alertas/04-Visibilidade-Alertas-Saude`): categoria do alerta, ou existência de evento de saúde. Registrar a decisão na doc de regras.
2. Derivar as duas assinaturas de um único predicado:

```ts
function isHealthAlertByCategoryId(categoryId: string): boolean {
  return categoryId === HEALTH_ALERT_CATEGORY_ID;
}

// se a fonte for a categoria do alerta:
export function isHealthAlert(alert: AlertDetails): boolean {
  return isHealthAlertByCategoryId(alert.categoryId.toString());
  // atenção: AlertDetails hoje NÃO expõe categoryId do alerta — precisará expor no read model
}
```

3. Ajustar o read model/mapper se a fonte escolhida exigir campo novo (`AlertDetails` hoje só tem categoria via `events[]`).
4. Ampliar `health-alert-visibility.spec.ts` com o caso divergente (alerta categoria X + evento de saúde) — teste que hoje documentaria o bug.

> [!warning] Comportamento visível ao usuário pode mudar
> Alertas que antes apareciam (ou eram ocultados) por um dos caminhos podem inverter. Validar com produto antes do deploy; é correção de privacidade, não refactor neutro.

## Resultado esperado

- Um único predicado `isHealthAlert*`; as duas variantes de visibilidade derivam dele.
- Mesmo alerta → mesma decisão de visibilidade em list, get-by-id, comment e reaction.
- Decisão documentada em `Regras-de-Negocio/Alertas/04-Visibilidade-Alertas-Saude`.

## Checklist

- [ ] Fonte de verdade decidida com time/produto e documentada
- [ ] Predicado único implementado; variantes derivadas
- [ ] Read model ajustado se necessário (categoryId do alerta em `AlertDetails`)
- [ ] Spec com caso divergente (categoria X + evento saúde) passando
- [ ] Call sites conferidos: list, get-by-id, comment, reaction
- [ ] Validação de produto sobre mudança de visibilidade
