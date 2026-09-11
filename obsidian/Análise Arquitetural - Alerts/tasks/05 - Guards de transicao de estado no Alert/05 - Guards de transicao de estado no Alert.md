---
title: Task 05 - Guards de transição de estado no Alert
tags:
  - alerts
  - ddd
  - gof
  - task
severidade: Média
esforco: Baixo
fase: 1
status: pendente
---

#alerts #ddd #gof #task

# Task 05 — Guards de transição de estado no agregado `Alert`

> Origem: [[Comportamentais#State — ⚠️ parcialmente ausente (versão leve recomendada)|State (versão leve)]] · TODO geral: [[00 - TODO Geral]]

## O que fazer

`doAccept()`, `doReject()`, `doClose()` em `apps/api/src/domain/alerts/entities/alert.ts` mudam status **de qualquer estado** — as invariantes moram nos use cases (`if (!alert.isPending)`), fora do agregado. Novo call site pode corromper o ciclo de vida silenciosamente (ex.: `doAccept()` num alerta CLOSED).

Ciclo de vida correto (ver `Regras-de-Negocio/Alertas/01-Ciclo-de-Vida`):

```
PENDING → ACCEPTED → CLOSED
PENDING → REJECTED
PENDING → CLOSED (expiração)
```

## Como fazer

Guards dentro do agregado — **não** State pattern com classes (4 estados triviais não justificam):

```ts
public doAccept() {
  if (!this.isPending) return;        // decisão: no-op ou lançar DomainError
  this.props.status = "ACCEPTED";
  this.addDomainEvent(new AlertAcceptedEvent(...)); // já feito na Task 01
  this.touch();
}

public doReject() {
  if (!this.isPending) return;
  this.props.status = "REJECTED";
  this.touch();
}

public doClose() {
  if (this.isClosed || this.isRejected) return;
  this.props.status = "CLOSED";
  this.addDomainEvent(new AlertClosedEvent(this.id));
  this.touch();
}
```

Decisão a tomar: no-op silencioso vs retornar/lançar erro. Recomendado: **no-op** para `doClose` (expiração é idempotente por natureza) e no-op para os demais — os use cases já retornam erros específicos antes de chamar; o guard é a segunda linha de defesa.

> [!tip] Fazer junto com a [[01 - Reativar AlertAcceptedEvent|Task 01]]
> Mesmo arquivo, mesma função. O guard em `doAccept` também evita reemissão de `AlertAcceptedEvent` num alerta já aceito.

## Resultado esperado

- Transição inválida não altera estado nem emite evento, independente do caller.
- Use cases existentes continuam retornando seus erros específicos (comportamento HTTP inalterado).

## Checklist

- [ ] Guard em `doAccept` (só de PENDING)
- [ ] Guard em `doReject` (só de PENDING)
- [ ] Guard em `doClose` (não de CLOSED/REJECTED)
- [ ] Decisão no-op vs erro registrada em comentário curto no código
- [ ] `alert.spec.ts` criado: matriz de transições válidas/inválidas + eventos emitidos
- [ ] Suite verde
