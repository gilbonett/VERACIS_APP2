---
title: Observabilidade - Comunidades
tags:
  - regra-de-negocio
  - comunidades
  - observabilidade
  - opentelemetry
aliases:
  - Community Observability
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Observabilidade

| | |
|---|---|
| **Domínio** | [[Comunidades]] |
| **Código-fonte** | `apps/api/src/domain/communities/` |
| **Última atualização** | 2026-07-22 |

---

## 1. Cobertura Atual

**Zero.** Nenhum decorator (`@ObserveBusiness`, `@ObserveEvent`, `@ObserveQueue`) em nenhum arquivo do domínio — o domínio também não tem eventos nem filas, então só `@ObserveBusiness` seria aplicável.

## 2. Avaliação de Risco

Diferente da lacuna equivalente em [[11-Observabilidade|Usuários]] (fluxos sensíveis sem instrumentação — prioridade alta), aqui o impacto é baixo: são três consultas de dados de referência, sem mutação e sem regra condicional. A instrumentação padrão de HTTP/banco (traces automáticos do OpenTelemetry na camada de infraestrutura) já cobre o essencial para essas rotas.

Ao introduzir o primeiro caso de uso de escrita neste domínio (criar comunidade/evento), aplicar `@ObserveBusiness` desde o início — não repetir o padrão de Usuários.

## Ver também

- [[Comunidades]] — índice do domínio
- [[13-Observabilidade|Observabilidade - Alertas]] — o padrão de referência do projeto
- [[11-Observabilidade|Observabilidade - Usuários]] — a mesma lacuna com risco maior
- [[Geral|VERACIS]] §12
