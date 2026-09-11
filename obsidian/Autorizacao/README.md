---
title: Plataforma de Autorização - VERACIS
tags:
  - authorization
  - rbac
  - iam
  - indice
aliases:
  - Autorização
  - Authorization Platform
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Plataforma de Autorização
### Arquitetura Oficial — Índice Mestre

[[Geral]] › **Autorização**

| | |
|---|---|
| **Documento** | Arquitetura da Plataforma de Autorização — VERACIS |
| **Versão** | 1.0 |
| **Status** | Ativo |
| **Classificação** | Uso Interno |
| **Última atualização** | 2026-07-24 |
| **Código-fonte** | `apps/api/src/domain/*/policies/`, `apps/api/src/infra/http/guards/` |
| **Mantenedor** | Equipe VERACIS — Backend/Arquitetura |

---

## 1. Sobre este documento

Referência oficial da **Plataforma de Autorização**: papéis, permissões, policies, ownership, escopos, cache, auditoria e evolução. Autorização é **domínio independente** — desacoplado da autenticação, mas integrado à [[Autenticacao/README|Plataforma de Identidade]]: **Identity prova quem é; Authorization decide o que pode.** Nenhum dos dois faz o trabalho do outro.

Base analítica: leitura direta do código (`apps/api`) em 2026-07-24, toda a arquitetura de [[Autenticacao/README|Autenticação]] (v2.0) e o estudo prévio de permissionamento em [[Análise Arquitetural - Alerts/tasks/15 - RBAC de permissionamento por roles/15 - RBAC de permissionamento por roles|Task 15]]. Esta documentação **aprofunda** as decisões já registradas (ADR-004/ADR-009 da Identidade, desenho da Task 15) — não as contradiz nem as redecide.

> [!important] Legenda (mesma convenção do vault)
> **✅ Confirmado** — lido no código. **🎯 Proposto** — arquitetura-alvo. **🟡 Parcial**.

## 2. Estrutura da Documentação

| Documento | Conteúdo |
|---|---|
| [[00-Gap-Analysis\|00 — Gap Analysis]] | Permissionamento atual vs. proposto, com crítica e reuso |
| [[01-Visao-Geral\|01 — Visão Geral]] | Princípios, fronteira Identity↔Authorization, visão em camadas |
| [[02-Requisitos\|02 — Requisitos]] | RF/RNF rastreados a OWASP ASVS V8 e NIST |
| [[03-Regras-de-Negocio\|03 — Regras de Negócio]] | Catálogo RN-001+ (herança, revogação, conflitos, ownership) |
| [[04-Arquitetura\|04 — Arquitetura]] | Motor de decisão em 3 camadas, fluxo de autorização, C4 |
| [[05-Dominios\|05 — Domínios]] | Subdomínios: Catálogo, Atribuição, Decisão, Administração |
| [[06-Modelo-de-Dados\|06 — Modelo de Dados]] | Entidades (tabela × código × adiada) + ERD |
| [[07-RBAC\|07 — RBAC]] | Hierarquia (camada 1) + catálogo de papéis (camada 2) |
| [[08-Policies\|08 — Policies]] | Policies como código: quando, como, registro, teste |
| [[09-Ownership\|09 — Ownership]] | Dono, comunidade, global — escopos de grant |
| [[10-CASL-ou-Estrategia\|10 — CASL ou Estratégia]] | Avaliação honesta de CASL/engines e a decisão |
| [[11-API\|11 — API]] | Administração de roles/permissões, consulta de abilities |
| [[12-Eventos\|12 — Eventos]] | Eventos de domínio da autorização |
| [[13-Cache\|13 — Cache]] | PermissionSet em Redis, invalidação por evento |
| [[14-Auditoria\|14 — Auditoria]] | Trilha unificada com a Identidade (quem concedeu, quando, por quê) |
| [[15-Seguranca\|15 — Segurança]] | Escalação de privilégio, confused deputy, SoD, defense in depth |
| [[16-Testes\|16 — Testes]] | Matriz de testes de autorização |
| [[17-ADR\|17 — ADRs]] | ADR-AZ-01 a AZ-07 |
| [[18-Roadmap\|18 — Roadmap]] | 9 fases (detalha a Fase 3 do roadmap da Identidade) |
| [[19-Tasks\|19 — Tasks]] | Backlog AUTHZ-001+ |
| [[20-Referencias\|20 — Referências]] | NIST, OWASP, ePING, docs oficiais |

## 3. Mapa de Diagramas

| Diagrama | Localização |
|---|---|
| Arquitetura Geral | [[04-Arquitetura]] §2 |
| Fluxo de Autorização | [[04-Arquitetura]] §3 |
| Fluxo de Ability | [[10-CASL-ou-Estrategia]] §5 |
| Fluxo de Policy | [[08-Policies]] §4 |
| Fluxo de Ownership | [[09-Ownership]] §4 |
| ERD | [[06-Modelo-de-Dados]] §4 |
| Comunicação Identity ↔ Authorization | [[diagrams/Comunicacao-Identity-Authorization\|diagrams/Comunicacao-Identity-Authorization]] |
| C4 Context / Container / Component | [[diagrams/C4-Context\|diagrams/C4-Context]] · [[diagrams/C4-Container\|diagrams/C4-Container]] · [[diagrams/C4-Component\|diagrams/C4-Component]] |

## 4. Relação com o Restante do Vault

- [[Autenticacao/README|Plataforma de Identidade]] — quem é o usuário; esta pasta decide o que ele pode. ADR-004/009 de lá são os pais das decisões daqui.
- [[Análise Arquitetural - Alerts/tasks/15 - RBAC de permissionamento por roles/15 - RBAC de permissionamento por roles|Task 15]] — desenho do `@MinRole`/`RolesGuard` (camada 1). **Esta documentação o executa e estende; não o substitui.**
- [[Regras-de-Negocio/Usuarios/Usuarios|Regras de Negócio — Usuários]] — origem do enum `UserRole` e das memberships.

## Ver também

- [[Geral]] — visão geral do projeto
- [[00-Gap-Analysis]] — comece por aqui
