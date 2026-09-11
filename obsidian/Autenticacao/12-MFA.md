---
title: MFA - Plataforma de Identidade
tags:
  - identity
  - auth
  - mfa
  - webauthn
  - totp
aliases:
  - MFA IAM
  - Passkeys
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# MFA — Autenticação Multifator

| | |
|---|---|
| **Domínio** | [[README\|Plataforma de Identidade]] |
| **Código-fonte** | `apps/api/src/domain/auth/entities/otp-challenge.ts` |
| **Última atualização** | 2026-07-24 |

---

## 1. Estado Atual — ✅ E-mail OTP

Único fator hoje: código 6 dígitos por e-mail, opt-in (`user.otpEnabled`). Máquina de estados `OtpChallenge` (PENDING_EMAIL → PENDING_CODE → VERIFIED | EXPIRED), TTL 10min, máx. 5 tentativas, código armazenado como HMAC com secret dedicado. Sólido para o que é.

> [!danger] Bug confirmado, sem impacto hoje: `OtpChallenge.expire()` seta `state = "VERIFIED"` (deveria ser `"EXPIRED"`). Código morto — zero chamadores. Corrigir ou remover (task IDP-013).

## 2. Matriz de Fatores

| Fator | AAL (NIST 800-63B) | Resiste a phishing? | Custo | Fase |
|---|---|---|---|---|
| E-mail OTP ✅ | ~AAL1.5 (fator fraco — canal compartilha destino com reset de senha) | Não | Zero (já existe) | atual |
| **TOTP** (RFC 6238) 🎯 | AAL2 | Não (código digitável é phishável) | Baixo | 6 |
| **SMS OTP** | AAL2 restrito | Não; SIM-swap é vetor ativo — NIST 800-63B o classifica como canal RESTRICTED | Custo por envio | ❌ não recomendado; só se inclusão digital exigir, com risco registrado |
| **WebAuthn/FIDO2/Passkeys** 🎯 | **AAL3** (resistente a phishing — credencial vinculada à origem) | **Sim** | Médio (challenge/attestation) | 6-7 |
| Recovery codes 🎯 | Fallback, não fator | — | Baixo | 6 |

Direção: TOTP fecha AAL2 real; **Passkeys são o alvo** — resistência a phishing é o diferencial que nenhum OTP dá, e GOV.BR já sinaliza suporte a passkeys no ecossistema federal.

## 3. Arquitetura Multi-fator — `MfaSecret`

A entidade generaliza o desenho atual sem redesenhar o fluxo ([[06-Modelo-de-Dados]]): `type` (EMAIL_OTP/TOTP/WEBAUTHN), `secretEncrypted` (seed TOTP cifrada / chave pública WebAuthn), `confirmedAt` (fator só ativo após confirmação — enrollment nunca ativa direto), `lastUsedAt`. O sign-in ramifica em "quais fatores ativos o usuário tem" em vez do booleano `otpEnabled` — migração: `otpEnabled=true` vira uma linha `MfaSecret(type: EMAIL_OTP, confirmedAt: now)`.

Fluxos de enrollment/login em [[07-Fluxos]] §6.

## 4. Recovery Codes

- Gerados no ativamento do primeiro fator forte; exibidos **uma única vez**; armazenados como hash (Argon2id — mesmo tratamento de senha).
- Uso único; consumo gera evento de auditoria e alerta por e-mail.
- Regenerar invalida todos os anteriores.

## 5. Trusted Devices

Dispositivo que completou MFA pode ser marcado confiável: `TrustedDevice { fingerprint, label, trustedAt, expiresAt }`. Pula o desafio MFA por período limitado (ex.: 30d). Regras: fingerprint nunca é só o user-agent (fraco demais); confiança **expira sempre**; revogar dispositivo remove a confiança; conta bloqueada limpa todos.

## 6. Step-up Authentication

Ações sensíveis (trocar e-mail, desativar MFA, logout global) exigem re-desafio mesmo em sessão válida — política na Identity, por ação, usando `assuranceLevel` da sessão ([[08-Providers]] §5). Zero Trust aplicado: sessão válida ≠ carta branca.

## Ver também

- [[README]] — índice
- [[07-Fluxos]] §6
- [[06-Modelo-de-Dados]]
- [[14-Seguranca]]
