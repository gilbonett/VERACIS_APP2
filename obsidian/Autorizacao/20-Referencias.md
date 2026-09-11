---
title: Referências - Autorização
tags:
  - authorization
  - referencias
aliases:
  - Referências Autorização
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Referências

| | |
|---|---|
| **Domínio** | [[README\|Plataforma de Autorização]] |
| **Última atualização** | 2026-07-24 |

---

## 1. Padrões e Normas

| Referência | Assunto | Usada em |
|---|---|---|
| INCITS 359 (NIST RBAC) | Modelo RBAC; ausência de permissões negativas | [[07-RBAC]], ADR-AZ-01/02 |
| NIST SP 800-162 | ABAC — atributos de sujeito/recurso/ambiente | [[08-Policies]], ADR-AZ-03 |
| NIST SP 800-63C | Federação — asserções de papel de IdP externo | [[07-RBAC]] §5 |
| OWASP ASVS V8 (Authorization) | Deny by default, enforcement server-side, contexto, trilha | [[02-Requisitos]] §3, [[15-Seguranca]] |
| OWASP Top 10 — A01 Broken Access Control | O risco central que esta plataforma fecha | [[00-Gap-Analysis]], [[15-Seguranca]] §1 |
| OWASP Authorization Cheat Sheet | Boas práticas de enforcement | [[04-Arquitetura]] |
| ePING | Padrões abertos / interoperabilidade governamental | RN-012, integração SCPA |

## 2. Documentação Oficial Avaliada

| Referência | Papel na decisão |
|---|---|
| CASL (casl.js.org) — abilities, conditions, `@casl/ability` | Avaliada e adiada com gatilhos — [[10-CASL-ou-Estrategia]], ADR-AZ-03 |
| NestJS — Authorization (docs oficiais) | Base do padrão guard/decorator; divergência deliberada (`@MinRole` hierárquico vs. lista) justificada na Task 15 Passo 5 |
| OPA/Rego · AWS Cedar/Verified Permissions | Engines externas avaliadas e rejeitadas com gatilhos — ADR-AZ-03, ADR-009 (Identidade) |
| Prisma — relations/indexes | Modelagem de [[06-Modelo-de-Dados]] |

## 3. Interno (vault e código)

| Referência | Relação |
|---|---|
| [[Autenticacao/README|Plataforma de Identidade]] (ADR-004, 009, 011, 012) | Decisões-pai desta pasta |
| [[Análise Arquitetural - Alerts/tasks/15 - RBAC de permissionamento por roles/15 - RBAC de permissionamento por roles|Task 15]] (+ Passos 1-5) | Desenho da camada 1 — executado por AUTHZ-001/002 |
| [[Regras-de-Negocio/Alertas/Alertas|Regras de Negócio — Alertas]] | Fonte das regras que viram grants/policies |
| [[Banco-de-Dados/Banco-de-Dados|Banco de Dados]] | Disciplina de índices herdada pelas tabelas novas |
| `apps/api/src/domain/*/policies/` ✅ | As policies reais que a camada 3 padroniza |

## Ver também

- [[README]] — índice
- [[17-ADR]]
