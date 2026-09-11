---
title: TODO Geral - Tasks Alerts
tags:
  - alerts
  - refactor
  - todo
---

#alerts #refactor #todo

# ✅ TODO Geral — Tasks do Alerts

> Uma pasta por task, ordenadas por urgência (01 = mais urgente). Cada task tem seu próprio checklist interno. Origem: [[07 - Plano de Ação Priorizado]].

## 🔴 Urgente — bugs de negócio e integridade (fazer já)

- [ ] [[01 - Reativar AlertAcceptedEvent]] — alerta confirmado por reações nunca expira nem notifica **(Alta/Médio)**
- [ ] [[02 - Transacao no PrismaAlertRepository]] — agregado parcial no banco em falha de escrita **(Alta/Baixo)**
- [ ] [[03 - Corrigir crash no GetAlertMetrics]] — `TypeError` p/ usuário sem comunidade **(Alta/Baixo)**

## 🟠 Importante — qualidade e resiliência (mesma sprint ou próxima)

- [ ] [[04 - Extrair politica de confirmacao de reacao]] — God use case, magic number 5, deps mortas **(Média/Baixo)**
- [ ] [[05 - Guards de transicao de estado no Alert]] — `doAccept`/`doClose` de qualquer estado **(Média/Baixo)**
- [ ] [[06 - Retry e DLQ reais no BullMQ]] — DLQ cenografada, sem attempts/backoff **(Média/Baixo)**
- [ ] [[07 - Tirar telemetria do dominio]] — `@ObserveBusiness` em `create-alert.ts` **(Média/Baixo)**
- [ ] [[08 - Limpeza de dead code e TTLs nomeados]] — updateStatus, include ignorado, typo, TTLs **(Baixa/Baixo)**

## 🟡 Consolidação — Fase 2

- [ ] [[09 - Await nos handlers do DomainEvents]] — fire-and-forget engole falhas de notificação **(Média/Médio)**
- [ ] [[10 - Job de reconciliacao de alertas orfaos]] — cobre crash/evento perdido/job Redis perdido **(Média/Médio)**
- [ ] [[11 - Unificar definicao de alerta de saude]] — 2 variantes divergentes da política **(Média/Médio)**
- [ ] [[12 - Lint de camadas e shared kernel UserRole]] — trava regressão domain→infra **(Média/Baixo)**

## 🟢 Estrutural — Fase 3 (quando doer)

- [ ] [[13 - Criar AlertsModule]] — tirar Alerts do http.module monolítico **(Média/Alto)**
- [ ] [[14 - DomainEventBus injetavel]] — matar singleton estático do core **(Média/Alto)**

## 🔵 Feature — RBAC

- [ ] [[15 - RBAC de permissionamento por roles]] — `@MinRole` + `RolesGuard` na borda, policies puras no domínio; 5 passos detalhados na pasta **(Média/Médio)**

---

> [!warning] Dependências entre tasks
> - **01** deve migrar os subscribers guardados por `ACCEPTED` na mesma mudança (senão efeito duplo).
> - **04** e **05** tocam os mesmos arquivos da **01** — ideal fazer 01 → 05 → 04 em sequência.
> - **09** e **14** são dívidas do `core` (afetam todos subdomínios) — coordenar com o time.
> - **15** (Passo 1) sobrepõe a parte de `UserRole` da **12** — quem vier primeiro faz; a outra só complementa.
