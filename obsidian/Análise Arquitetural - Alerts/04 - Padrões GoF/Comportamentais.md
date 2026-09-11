---
title: Padrões GoF Comportamentais
tags:
  - gof
  - alerts
  - ddd
  - refactor
---

#gof #alerts #ddd #refactor

# Padrões GoF — Comportamentais

> Mapa visual: [[Mapa de Padrões Aplicáveis.canvas]]. Refatorações com código em [[Refatoração Proposta - Use Cases]].

## Strategy — ⚠️ deveria existir (na forma leve)

A confirmação de alerta tem **3 estratégias implícitas** inline no `CreateAlertReactionUseCase`: staff confirma direto, membro "coringa" confirma com 1 like, membros comuns por quórum de 5. É o candidato mais legítimo a Strategy do subdomain — mas a forma certa aqui é **função de política pura** (`reactionConfirmsAlert`, código em [[Refatoração Proposta - Use Cases#R1]]), não hierarquia de classes: as regras não variam por configuração em runtime e cabem em 12 linhas. Classes Strategy só se o produto exigir regras de confirmação plugáveis por comunidade.

O precedente já existe no próprio subdomain: `policies/health-alert-visibility.ts` é exatamente esse estilo (estratégia como função pura, testada isoladamente). Consistência > cerimônia.

## Observer — ✅ já existe (com 2 defeitos)

`DomainEvents` + `EventHandler` é Pub/Sub clássico: agregado registra eventos, repositório despacha pós-persistência, subscribers reagem (`OnAlertCreatedSchedulePendingExpiration`, `OnAlertCreatedNotifyMembers`, `OnAlertClosed`). O mecanismo de `guard` no `register()` (filtra por status antes de invocar o handler) é um refinamento elegante.

> [!warning] Dois defeitos no Observer
> 1. **Evento faltante**: `AlertAcceptedEvent` nunca é emitido — o observer mais importante do ciclo de vida não tem o que observar ([[Violações de Clean Architecture#V3]]).
> 2. **Dispatch fire-and-forget**: `DomainEvents.dispatch` chama `callback(event)` sem `await` — handler async que falha vira unhandled rejection; ninguém sabe que a notificação não foi criada. Ver [[DI, Repository e Domain Events]].

## Chain of Responsibility — ❌ não aplicar

O pipeline de validação do `create-alert-reaction` (existe? está aberto? pode ver? já reagiu?) é sequência **fixa** de guards com early return — legível como está. CoR se paga quando handlers são adicionados/reordenados dinamicamente; aqui adicionaria indireção sem flexibilidade útil.

## Command — ✅ já existe (de facto)

Cada use case é um Command: objeto que encapsula uma ação (`execute(request) → Either`), injetável, componível (processors de fila reutilizam `CloseExpired*AlertUseCase` — o mesmo "command" servido por HTTP e por worker). Formalizar com interface `Command`/invoker genérico não traria ganho — Nest já faz o papel de invoker. Undo/redo não é requisito.

## State — ⚠️ parcialmente ausente (versão leve recomendada)

`AlertStatus` (`PENDING | ACCEPTED | REJECTED | CLOSED`) tem transições **sem validação**:

```ts
public doAccept() { this.props.status = "ACCEPTED"; ... }  // de qualquer estado!
public doClose()  { this.props.status = "CLOSED"; ... }    // idem
```

Hoje os *use cases* validam antes de chamar (`if (!alert.isPending)`), ou seja: a invariante do agregado mora fora dele. Um `doAccept()` chamado num alerta `CLOSED` corromperia o ciclo de vida silenciosamente.

**Não** recomendo o State pattern completo (classes por estado) — 4 estados e 3 transições não justificam. Recomendo a versão de 5 linhas — guard dentro do agregado:

```ts
public doAccept() {
  if (!this.isPending) return;   // ou lançar DomainError
  this.props.status = "ACCEPTED";
  this.addDomainEvent(new AlertAcceptedEvent(...));
  this.touch();
}
```

Trade-off: classes State dariam transições explícitas e polimorfismo de comportamento por estado — mas o comportamento por estado aqui é trivial (só o conjunto de transições válidas muda). Mapa de transições + guards cobre 100% do risco com 5% do código.

## Template Method — ❌ não aplicar

`CloseExpiredPendingAlertUseCase` / `CloseExpiredAcceptedAlertUseCase` diferem em 1 validação — Template Method (classe base + hook abstrato) resolveria, mas **parametrização resolve melhor** (sem herança, sem classe extra): ver [[Refatoração Proposta - Use Cases#R4]]. Herança para variar 1 predicado é o exemplo clássico de Template Method forçado.

## Mediator — ❌ não aplicar

A coordenação entre componentes já é mediada por dois mecanismos: o container DI do Nest (wiring) e o `DomainEvents` (comunicação desacoplada). Um Mediator adicional criaria terceiro canal de coordenação — mais confusão, não menos acoplamento.

## Specification — ⚠️ existe informalmente (suficiente)

`canViewHealthAlert`, `canViewHealthAlertByCategory`, `filterAlertsByHealthVisibility` e `memberSingleClickLikeConfirmsAlert` **são** specifications: predicados de domínio nomeados, puros, testáveis. Falta só a formalização (interface `Specification<T>` com `and/or/not`) — que **não** recomendo enquanto as regras não precisarem de composição dinâmica. A duplicação real entre `canViewHealthAlert` (via `AlertDetails.events`) e `canViewHealthAlertByCategory` (via `categoryId` direto) está mapeada em [[06 - Duplicidades e Reuso]].

## Resumo

| Padrão | Estado | Ação |
|---|---|---|
| Strategy | ⚠️ 3 regras inline no use case | extrair política pura `reactionConfirmsAlert` (**prioridade alta**) |
| Observer | ✅ DomainEvents | corrigir `AlertAcceptedEvent` + await nos handlers |
| Chain of Responsibility | — | não aplicar (guards fixos) |
| Command | ✅ use cases | manter |
| State | ⚠️ transições sem guard | guards de transição no agregado (versão leve) |
| Template Method | — | não aplicar (parametrizar em vez de herdar) |
| Mediator | — | não aplicar (DI + eventos já mediam) |
| Specification | ⚠️ informal (funções puras) | manter estilo; formalizar só com composição dinâmica |
