---
title: Criação de Alertas
tags:
  - regra-de-negocio
  - alertas
  - criacao
aliases:
  - Create Alert
  - Alert Creation
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Criação de Alertas

| | |
|---|---|
| **Domínio** | [[Alertas]] |
| **Caso de uso** | `CreateAlertUseCase` |
| **Código-fonte** | `apps/api/src/domain/alerts/use-cases/create-alert.ts`, `apps/api/src/domain/alerts/entities/alert.ts` (`Alert.create`) |
| **Última atualização** | 2026-07-22 |

---

## 1. Campos e Obrigatoriedade

| Campo | Obrigatório | Observação |
|---|---|---|
| `lat`, `lng` | Sim | Coordenadas geográficas do alerta |
| `communityId` | Sim | Comunidade à qual o alerta pertence |
| `categoryId` | Sim | Categoria do alerta |
| `authorId` | Sim | Usuário que registrou o alerta |
| `description` | Não | Texto livre, pode ser `null`/omitido |
| `eventIds` | Sim (lista, pode ser vazia) | Sempre associado ao alerta na criação, mesmo vazio |
| `riskIds` | Não (lista) | Só é associado se a lista **não** estiver vazia |
| `currentUserRole` | Sim | Determina o status inicial (ver seção 2) |

## 2. Status Inicial por Papel

Regra central da criação — definida em `Alert.create()`:

```
se currentUserRole !== "MEMBER":
    alerta nasce ACCEPTED (doAccept() chamado na criação)
senão:
    alerta nasce PENDING
```

- `MEMBER`: alerta nasce `PENDING`, precisa de confirmação comunitária. Ver [[03-Confirmacao-Comunitaria]].
- `LEADER`, `MANAGER`, `ROOT`: alerta nasce **já aceito**, sem passar por confirmação. Ver [[01-Ciclo-de-Vida]].

## 3. Associação de Eventos e Riscos

- `doAssociateEvents(eventIds)` é chamado incondicionalmente, mesmo com lista vazia — o alerta sempre tem uma `AlertEventList`, ainda que vazia.
- `doAssociateRisks(riskIds)` só é chamado se `riskIds.length > 0` — um alerta pode não ter nenhum risco associado.
- Ambas as associações substituem a lista inteira (não fazem merge incremental) — reflexo do padrão `WatchedList` usado nas entidades filhas.

## 4. Evento de Domínio Emitido

Toda criação (`Alert.create()`) dispara `AlertCreatedEvent`, incondicionalmente, contendo `alertId`, `status`, `authorId`, `communityId` e `categoryId`.

Esse evento é o gatilho para o agendamento de expiração automática — ver [[05-Expiracao-Automatica]] e [[11-Eventos-de-Dominio]].

## 5. Observabilidade

O caso de uso é decorado com `@ObserveBusiness({ flow: "alert", action: "create" })`. Ver [[13-Observabilidade]].

## Ver também

- [[Alertas]] — índice do domínio
- [[01-Ciclo-de-Vida]]
- [[03-Confirmacao-Comunitaria]]
- [[05-Expiracao-Automatica]]
- [[11-Eventos-de-Dominio]]
