---
title: Requisitos - Plataforma de Identidade
tags:
  - identity
  - auth
  - requisitos
aliases:
  - Requisitos IAM
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Requisitos

| | |
|---|---|
| **Domínio** | [[README\|Plataforma de Identidade]] |
| **Última atualização** | 2026-07-24 |

---

## 1. Requisitos Funcionais

| ID | Requisito | Estado hoje | Referência |
|---|---|---|---|
| RF-01 | Autenticar usuário por credencial local (CPF+senha) | ✅ Implementado | [[07-Fluxos]] §1 |
| RF-02 | Recusar autenticação de conta não-ativa (`DISABLED`/`BLOCKED`) | ❌ **Gap crítico** | [[00-Gap-Analysis]] §3.1 |
| RF-03 | Exigir segundo fator quando habilitado pelo usuário | 🟡 Parcial (só e-mail OTP) | [[12-MFA]] |
| RF-04 | Suportar TOTP e WebAuthn/Passkeys como fatores | ❌ Proposto | [[12-MFA]] |
| RF-05 | Emitir e validar sessão com revogação imediata | ✅ Implementado | [[11-Sessoes]] |
| RF-06 | Logout da sessão atual | ✅ Implementado | [[07-Fluxos]] §2 |
| RF-07 | Logout global e por dispositivo; listar sessões ativas | ❌ Proposto | [[11-Sessoes]] §5 |
| RF-08 | Recuperação de senha com token de uso único e revogação em cascata | ✅ Implementado | [[07-Fluxos]] §7 |
| RF-09 | Autenticar via provedor externo (GOV.BR, SCPA, LDAP, OIDC genérico) sem alterar APIs | ❌ Proposto | [[08-Providers]] |
| RF-10 | Vincular múltiplas identidades federadas a um mesmo usuário | ❌ Proposto | [[06-Modelo-de-Dados]] §2 (`Identity`) |
| RF-11 | Autorização de borda por papel mínimo (`@MinRole`) | ❌ Planejado (Task 15) | [[09-Autorizacao]] |
| RF-12 | Catálogo de permissões `recurso:ação` para controle fino | ❌ Proposto (fase 3) | [[09-Autorizacao]] §4 |
| RF-13 | Registrar trilha de auditoria imutável de todo evento de identidade | ❌ Proposto | [[13-Auditoria]] |
| RF-14 | Emitir tokens OAuth 2.1/OIDC para clientes não-cookie (fase 7) | ❌ Proposto | [[10-Tokens]] |
| RF-15 | Bloquear conta após N tentativas falhas (lockout) com desbloqueio auditável | ❌ Proposto | [[14-Seguranca]] §4 |
| RF-16 | Verificação de e-mail por token de uso único | ❌ Proposto | [[06-Modelo-de-Dados]] (`EmailVerificationToken`) |

## 2. Requisitos Não Funcionais

| ID | Requisito | Fundamento | Verificação |
|---|---|---|---|
| RNF-01 | Senhas armazenadas com KDF memory-hard (Argon2id), nunca reversíveis | OWASP Password Storage Cheat Sheet; NIST SP 800-63B | [[14-Seguranca]] §3 |
| RNF-02 | Tokens de sessão gerados por CSPRNG (≥128 bits de entropia) | NIST SP 800-63B §7.1 | ✅ hoje: 32 bytes `randomBytes` |
| RNF-03 | Revogação de sessão com efeito ≤ 1s (síncrona) | Zero Trust | [[11-Sessoes]] §4 |
| RNF-04 | Cookies `httpOnly` + `secure` + `sameSite` | OWASP Session Management Cheat Sheet | ✅ implementado |
| RNF-05 | Rate limiting em múltiplas camadas (IP, rota, conta) | OWASP ASVS V6; NIST 800-63B throttling | 🟡 parcial |
| RNF-06 | Nenhum segredo em código; secrets segregados por finalidade | ASVS V14 | ✅ (3 secrets HMAC distintos via env) |
| RNF-07 | Assinatura de tokens federados sempre assimétrica (ES256/RS256), nunca HS256 | RFC 8725 (JWT BCP) | [[10-Tokens]] §4 |
| RNF-08 | Escala horizontal sem estado em processo | — | [[04-Arquitetura]] §5 |
| RNF-09 | P99 de validação de sessão ≤ 10ms intra-região (com cache) | — | [[11-Sessoes]] §3 |
| RNF-10 | Trilha de auditoria append-only, retenção conforme LGPD/Marco Civil | LGPD; Lei 12.965/2014 art. 15 | [[13-Auditoria]] §5 |
| RNF-11 | Todos os protocolos de federação por padrão aberto (OAuth 2.1, OIDC, SAML se exigido) | ePING | [[08-Providers]] |
| RNF-12 | Observabilidade completa: spans, métricas e logs correlacionados por request | — | ✅ base OTEL existente |

## 3. Rastreio para OWASP ASVS (v5, capítulos relevantes)

| Capítulo ASVS | Cobertura nesta documentação |
|---|---|
| V6 — Authentication | RF-01..05, RF-15; [[14-Seguranca]] |
| V7 — Session Management | RF-05..07; [[11-Sessoes]] |
| V8 — Authorization | RF-11..12; [[09-Autorizacao]] |
| V9 — Self-contained Tokens | RF-14; [[10-Tokens]] |
| V11 — Cryptography | RNF-01, RNF-07; [[14-Seguranca]] |
| V16 — Security Logging | RF-13; [[13-Auditoria]] |

## 4. Níveis de Garantia NIST SP 800-63

| Nível | O que exige | Estado VERACIS |
|---|---|---|
| AAL1 | 1 fator | ✅ atendido (senha) |
| AAL2 | 2 fatores | 🟡 parcial — e-mail OTP é fator fraco; TOTP fecha AAL2 pleno |
| AAL3 | Fator resistente a phishing (hardware/passkey) | 🎯 alvo com WebAuthn ([[12-MFA]]) |

GOV.BR classifica contas em Bronze/Prata/Ouro — o mapeamento nível-GOV.BR → AAL interno está em [[08-Providers]] §2.

## Ver também

- [[README]] — índice
- [[03-Regras-de-Negocio]]
- [[14-Seguranca]]
- [[21-Referencias]]
