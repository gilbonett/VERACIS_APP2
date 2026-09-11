---
title: Referências - Plataforma de Identidade
tags:
  - identity
  - auth
  - referencias
aliases:
  - Referências IAM
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Referências

| | |
|---|---|
| **Domínio** | [[README\|Plataforma de Identidade]] |
| **Última atualização** | 2026-07-24 |

---

## 1. RFCs / IETF

| Referência | Assunto | Usada em |
|---|---|---|
| RFC 6749 / 6750 | OAuth 2.0 framework / Bearer tokens | [[10-Tokens]], [[15-API]] |
| OAuth 2.1 (draft-ietf-oauth-v2-1) | Consolidação: PKCE obrigatório, sem implicit | [[07-Fluxos]] §4 |
| RFC 7636 | PKCE | [[07-Fluxos]] §4 |
| RFC 7009 / 7662 | Revocation / Introspection | [[10-Tokens]] §7, [[15-API]] |
| RFC 7517 / 7519 | JWK(S) / JWT | [[10-Tokens]] |
| RFC 8414 | Authorization Server Metadata | [[15-API]] |
| RFC 8725 | **JWT Best Current Practices** — allowlist de alg, validações obrigatórias | [[10-Tokens]] §3 |
| RFC 9068 | JWT profile for OAuth access tokens | [[10-Tokens]] §2 |
| RFC 9700 | **OAuth 2.0 Security BCP** — BFF, refresh rotation, proteções de fluxo | [[04-Arquitetura]], [[10-Tokens]] |
| RFC 8252 | OAuth para apps nativos | fase mobile futura |
| RFC 6238 / 4226 | TOTP / HOTP | [[12-MFA]] |

## 2. NIST / Padrões de Autorização

| Referência | Assunto | Usada em |
|---|---|---|
| NIST SP 800-63B | Digital Identity — autenticadores, AAL, throttling, política de senha | [[02-Requisitos]] §4, [[12-MFA]], [[14-Seguranca]] |
| NIST SP 800-63C | Federação e asserções | [[08-Providers]] |
| INCITS 359 (NIST RBAC) | Modelo RBAC | [[09-Autorizacao]] |
| NIST SP 800-162 | ABAC | [[09-Autorizacao]] |

## 3. OWASP

| Referência | Usada em |
|---|---|
| ASVS (V6 Auth, V7 Session, V8 AuthZ, V9 Tokens, V11 Crypto, V16 Logging) | [[02-Requisitos]] §3, [[14-Seguranca]] §9 |
| Top 10 (A01 Broken Access Control, A07 Ident./Auth Failures) | [[00-Gap-Analysis]] |
| Password Storage Cheat Sheet (Argon2id `m=19MiB,t=2,p=1`) | [[14-Seguranca]] §3 |
| Session Management Cheat Sheet (absolute timeout) | [[11-Sessoes]] §2 |
| Forgot Password Cheat Sheet (anti-enumeração) | ✅ já aplicado no código |

## 4. OpenID Foundation / W3C / FIDO

| Referência | Usada em |
|---|---|
| OpenID Connect Core 1.0 / Discovery 1.0 | [[07-Fluxos]] §5, [[15-API]] |
| W3C WebAuthn (Level 2+) / FIDO2 CTAP | [[12-MFA]] |

## 5. Governo Federal / Legal

| Referência | Assunto | Usada em |
|---|---|---|
| ePING | Interoperabilidade por padrões abertos — fundamenta rejeição de PASETO e a escolha OIDC | [[10-Tokens]] §1, ADR-008 |
| GOV.BR — documentação de integração OIDC e níveis de conta (Bronze/Prata/Ouro) | Login cidadão | [[08-Providers]] §2, IDP-018 |
| SCPA (Ministério da Saúde) — Sistema de Cadastro e Permissão de Acesso | Perfis de acesso dos sistemas do MS | [[09-Autorizacao]] §4, IDP-019 |
| LGPD — Lei 13.709/2018 (arts. 7º, 16, 18) | Bases legais, retenção, direitos do titular | [[13-Auditoria]] §5 |
| Marco Civil — Lei 12.965/2014 (art. 15) | Guarda mínima de logs (6 meses) | [[13-Auditoria]] §5 |

## 6. Arquitetura

| Referência | Usada em |
|---|---|
| Fowler — "MonolithFirst" · Newman — *Building Microservices* | ADR-006 |
| C4 Model (Simon Brown) | `diagrams/C4-*` |

> [!warning] Links oficiais (gov.br, IETF, NIST) devem ser conferidos no momento do uso — URLs governamentais mudam; as identificações acima (número de RFC/SP/lei) são estáveis.

## Ver também

- [[README]] — índice
- [[17-ADR]]
