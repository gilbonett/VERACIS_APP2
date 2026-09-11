---
title: Plataforma de Identidade - VERACIS
tags:
  - identity
  - auth
  - iam
  - indice
aliases:
  - Autenticação
  - Identity Platform
  - IAM
status: Ativo
versao: "2.0"
classificacao: Uso Interno
---

# Plataforma de Identidade
### Arquitetura Oficial — Índice Mestre

[[Geral]] › **Autenticação**

| | |
|---|---|
| **Documento** | Arquitetura da Plataforma de Identidade — VERACIS |
| **Versão** | 2.0 |
| **Status** | Ativo |
| **Classificação** | Uso Interno |
| **Última atualização** | 2026-07-24 |
| **Código-fonte** | `apps/api/src/domain/auth/`, `apps/api/src/infra/auth/`, `apps/api/src/infra/cryptography/`, `apps/api/src/infra/http/guards/` |
| **Mantenedor** | Equipe VERACIS — Backend/Arquitetura |

---

## 1. Sobre este documento

Referência oficial da **Plataforma de Identidade** do VERACIS — não um "módulo de login". Cobre autenticação, autorização, sessões, tokens, MFA, auditoria, providers e o roadmap para integração com GOV.BR, SCPA, LDAP, Azure AD e qualquer IdP OAuth2/OIDC, **sem alterar regras de negócio da aplicação**.

Toda a análise de código citada nesta pasta foi feita por leitura direta do repositório (guards, use cases, entidades, schema Prisma, migrations, `package.json`, `main.ts`) em 2026-07-24 — nada foi assumido. Convenção de marcação em todos os documentos:

> [!important] Legenda de status das afirmações
> **✅ Confirmado** — lido no código, com referência `arquivo:linha`. **🎯 Proposto** — arquitetura-alvo, não implementada. **🟡 Parcial** — existe, mas incompleto frente ao alvo. Nunca uma afirmação de arquitetura-alvo é apresentada como se já existisse.

> [!warning] Histórico de versões desta pasta
> A v1.0 (2026-07-24, mesma data) usava estrutura de subpastas por domínio com 51 arquivos. A v2.0 (esta) reestrutura tudo no layout plano numerado abaixo, absorvendo integralmente o conteúdo da v1.0 (achados as-is, 7 ADRs, 9 tasks, 3 canvases — preservados em `diagrams/`). Nenhum achado foi descartado na migração.

## 2. Estrutura da Documentação

| Documento | Conteúdo |
|---|---|
| [[00-Gap-Analysis\|00 — Gap Analysis]] | Arquitetura atual vs. proposta, item a item, com estratégia de migração |
| [[01-Visao-Geral\|01 — Visão Geral]] | Contexto, princípios arquiteturais, visão em fases |
| [[02-Requisitos\|02 — Requisitos]] | RF/RNF com rastreio para OWASP ASVS e NIST SP 800-63 |
| [[03-Regras-de-Negocio\|03 — Regras de Negócio]] | Catálogo de regras de identidade (confirmadas e propostas) |
| [[04-Arquitetura\|04 — Arquitetura]] | Padrão BFF, Identity Kernel, camadas, C4, deployment |
| [[05-Dominios\|05 — Domínios]] | Identity, User, Authorization, Audit, Session, Token, Notification, Provider |
| [[06-Modelo-de-Dados\|06 — Modelo de Dados]] | 14 entidades justificadas + ERD |
| [[07-Fluxos\|07 — Fluxos]] | Diagramas Mermaid de todos os fluxos |
| [[08-Providers\|08 — Providers]] | Provider Pattern, GOV.BR, SCPA, LDAP, OIDC genérico |
| [[09-Autorizacao\|09 — Autorização]] | RBAC × ABAC × PBAC — decisão híbrida justificada |
| [[10-Tokens\|10 — Tokens]] | JWT × Opaque × PASETO — decisão em fases |
| [[11-Sessoes\|11 — Sessões]] | Store, sliding+absolute, dispositivos, revogação |
| [[12-MFA\|12 — MFA]] | TOTP, WebAuthn/Passkeys, recovery codes, AAL |
| [[13-Auditoria\|13 — Auditoria]] | Domínio de auditoria, outbox, retenção, LGPD |
| [[14-Seguranca\|14 — Segurança]] | Controles ASVS, Argon2id, pepper, rate limit, headers |
| [[15-API\|15 — API]] | Catálogo de endpoints atuais e alvo |
| [[16-Eventos\|16 — Eventos]] | Domain events atuais e propostos, outbox, correlação |
| [[17-ADR\|17 — ADRs]] | Todas as decisões arquiteturais (ADR-001 a ADR-013) |
| [[18-Roadmap\|18 — Roadmap]] | 10 fases, da Foundation à integração GOV.BR/SCPA |
| [[19-Tasks\|19 — Tasks]] | Backlog executável completo (IDP-001+) |
| [[20-Testes\|20 — Testes]] | Estratégia de testes por camada + testes de segurança |
| [[21-Referencias\|21 — Referências]] | RFCs, NIST, OWASP, OpenID Foundation, ePING, LGPD |

## 3. Mapa de Diagramas

| Diagrama exigido | Localização |
|---|---|
| Arquitetura Geral | [[04-Arquitetura]] §2 |
| C4 Context | [[diagrams/C4-Context\|diagrams/C4-Context]] |
| C4 Container | [[diagrams/C4-Container\|diagrams/C4-Container]] |
| C4 Component | [[diagrams/C4-Component\|diagrams/C4-Component]] |
| Deployment | [[diagrams/Deployment\|diagrams/Deployment]] |
| Comunicação entre Serviços | [[diagrams/Comunicacao-entre-Servicos\|diagrams/Comunicacao-entre-Servicos]] |
| Fluxo Login | [[07-Fluxos]] §1 |
| Fluxo Logout | [[07-Fluxos]] §2 |
| Fluxo Refresh | [[07-Fluxos]] §3 |
| Fluxo OAuth | [[07-Fluxos]] §4 |
| Fluxo OIDC | [[07-Fluxos]] §5 |
| Fluxo MFA | [[07-Fluxos]] §6 |
| Fluxo Password Reset | [[07-Fluxos]] §7 |
| Fluxo Sessões | [[07-Fluxos]] §8 |
| Fluxo Auditoria | [[07-Fluxos]] §9 |
| Relacionamento das Entidades (ERD) | [[06-Modelo-de-Dados]] §3 |
| Canvases visuais (v1, preservados) | `diagrams/*.canvas` |

## 4. Relação com o Restante do Vault

- [[Regras-de-Negocio/Usuarios/Usuarios|Regras de Negócio — Usuários]] — dados cadastrais; esta pasta não os redocumenta (fronteira em [[05-Dominios]] §3).
- [[Análise Arquitetural - Alerts/tasks/15 - RBAC de permissionamento por roles/15 - RBAC de permissionamento por roles|Task 15 — RBAC]] — base da camada coarse-grained de [[09-Autorizacao]]; esta documentação a complementa, não a substitui.
- [[Banco-de-Dados/Banco-de-Dados|Banco de Dados]] — auditoria de índices das tabelas de auth já feita lá.

## Ver também

- [[Geral]] — visão geral do projeto
- [[00-Gap-Analysis]] — comece por aqui
