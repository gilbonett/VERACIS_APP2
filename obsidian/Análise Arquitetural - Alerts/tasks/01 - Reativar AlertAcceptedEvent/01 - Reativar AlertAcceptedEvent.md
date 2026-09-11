---
title: Task 01 - Reativar AlertAcceptedEvent
tags:
  - alerts
  - refactor
  - task
severidade: Alta
esforco: Médio
fase: 1
status: pendente
---

#alerts #refactor #task

# Task 01 — Reativar `AlertAcceptedEvent`

> Origem: [[Violações de Clean Architecture#V3 — `AlertAcceptedEvent` comentado: ciclo de vida quebrado|V3]] · [[Refatoração Proposta - Use Cases#R2 — Reativar `AlertAcceptedEvent` e mover efeitos para subscribers|R2]] · TODO geral: [[00 - TODO Geral]]

## O que fazer

Reativar a emissão de `AlertAcceptedEvent` em `Alert.doAccept()` e criar os subscribers que completam o ciclo de vida. Hoje, alerta confirmado **por reações da comunidade**:
- não cancela o job de expiração PENDING (45 min);
- **nunca agenda** a expiração de ACCEPTED (30 min) → fica aberto para sempre;
- **não notifica** a comunidade (o texto "Alerta Confirmado pela Comunidade" só dispara quando líder cria alerta já aceito).

## Como fazer

1. Em `apps/api/src/domain/alerts/entities/alert.ts` — descomentar/reescrever a emissão:

```ts
public doAccept() {
  this.props.status = "ACCEPTED";
  this.addDomainEvent(
    new AlertAcceptedEvent(this.id, this.props.authorId,
      this.props.communityId, this.props.categoryId),
  );
  this.touch();
}
```

2. Criar `apps/api/src/infra/events/alerts/on-alert-accepted-reschedule-expiration.ts` (espelhar o padrão dos subscribers existentes): `cancelPending(alertId)` + `scheduleAccepted(alertId, ACCEPTED_TTL_MS)`.
3. Notificação: registrar handler de notificação também para `AlertAcceptedEvent` (novo `OnAlertAcceptedNotifyMembers` reutilizando a lógica de `OnAlertCreatedNotifyMembers`, ou registrar a mesma classe para os dois eventos).
4. **Migrar os subscribers antigos**: `OnAlertCreatedScheduleAcceptedExpiration` e o guard `ACCEPTED` de `OnAlertCreatedNotifyMembers` devem sair do `AlertCreatedEvent` — `Alert.create` com role ≠ MEMBER chama `doAccept()`, então o `AlertAcceptedEvent` passa a cobrir os dois caminhos (criação já aceita + aceite por reação). Fonte única.
5. Registrar novos subscribers no módulo (mesmo local dos atuais — buscar onde `OnAlertCreated*` são providos).

> [!warning] Sem o passo 4, alertas criados já aceitos disparam agendamento e notificação **em dobro** (o `jobId: alertId` protege o job, mas a notificação duplicaria).

## Resultado esperado

- Alerta aceito por reação: job pending cancelado, job accepted agendado (30 min), notificações criadas para a comunidade.
- Alerta criado já aceito (role ≠ MEMBER): comportamento atual preservado, sem duplicação.
- Nenhum subscriber restante escutando `AlertCreatedEvent` com guard `status === "ACCEPTED"`.

## Checklist

- [ ] Emissão de `AlertAcceptedEvent` reativada em `doAccept()`
- [ ] Subscriber `OnAlertAccepted` de expiração criado (cancel pending + schedule accepted)
- [ ] Notificação da comunidade ligada ao `AlertAcceptedEvent`
- [ ] Subscribers antigos com guard `ACCEPTED` migrados/removidos do `AlertCreatedEvent`
- [ ] Providers registrados no módulo
- [ ] Teste: aceite por reação (quórum) agenda expiração e cria notificações
- [ ] Teste: criação já aceita não duplica jobs nem notificações
- [ ] Teste manual ponta a ponta (criar alerta como MEMBER, confirmar com 5 likes, ver notificação + expiração)
