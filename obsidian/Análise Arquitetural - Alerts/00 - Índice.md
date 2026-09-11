---
title: Análise Arquitetural - Alerts (MOC)
tags:
  - ddd
  - clean-architecture
  - gof
  - refactor
  - alerts
  - moc
---

#ddd #clean-architecture #gof #refactor #alerts

# 🗺️ Análise Arquitetural — Alerts (MOC)

> Revisão do subdomain **Alerts** sob DDD, Clean Architecture e Design Patterns (GoF + arquiteturais). Realizada em 2026-07-23, branch `2950-structural-pattern-analytics`.

## TL;DR

> [!tip] Estado geral: sólido
> Repository Pattern, Domain Events, read model CQRS-lite, políticas puras e adapters de fila estão **bem implementados**. Os problemas são cirúrgicos, não estruturais.

> [!warning] Top 3 correções
> 1. `AlertAcceptedEvent` comentado → alerta confirmado por reações **nunca expira nem notifica** a comunidade.
> 2. Use case de domínio importando `@/infra/telemetry`.
> 3. Persistência do agregado em múltiplas tabelas **sem transação**.

## 📄 Notas

### Visão geral
- [[01 - Visão Geral e Metodologia]] — escopo, estrutura de pastas, fluxo ponta a ponta

### Violações arquiteturais
- [[Violações de Clean Architecture]] — V1–V7 com severidade e correção
- [[Dependências Indevidas entre Camadas]] — mapa de quem depende de quem
- [[Mapa de Dependências.canvas]] — 🎨 canvas: camadas com violações em vermelho

### Casos de uso
- [[Use Cases com Responsabilidades Excessivas]] — inventário SRP dos 10 use cases
- [[Refatoração Proposta - Use Cases]] — R1–R5 com código antes/depois

### Padrões GoF
- [[Criacionais]] — Factory Method ✅ · Singleton ⚠️ · Builder/Prototype ❌
- [[Estruturais]] — Adapter ✅ · Decorator/Facade ⚠️ · Composite/Proxy ❌
- [[Comportamentais]] — Observer/Command ✅ · Strategy/State ⚠️ · CoR/Mediator/Template ❌
- [[Mapa de Padrões Aplicáveis.canvas]] — 🎨 canvas: problema → padrão → benefício

### Padrões arquiteturais e resiliência
- [[DI, Repository e Domain Events]] — DI ✅ · Repository ✅ · Events com 3 defeitos
- [[Outbox, Saga, Circuit Breaker, Retry e Bulkhead]] — análise crítica de risco real

### Consolidação
- [[06 - Duplicidades e Reuso]] — D1–D6 + dead code
- [[07 - Plano de Ação Priorizado]] — 3 fases, 17 ações, o que **não** fazer
- [[Alertas - Arquitetura Atual.canvas]] — 🎨 canvas: arquitetura em camadas do fluxo completo

### Execução
- [[00 - TODO Geral]] — ✅ checklist global apontando para as 14 tasks (`tasks/`, uma pasta por task, ordenadas por urgência)

## Referências cruzadas do vault

- Regras de negócio documentadas: [[Alertas]] (`Regras-de-Negocio/Alertas/`)
