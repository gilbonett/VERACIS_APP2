---
title: API - Plataforma de Identidade
tags:
  - identity
  - auth
  - api
aliases:
  - API IAM
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# API

| | |
|---|---|
| **Domínio** | [[README\|Plataforma de Identidade]] |
| **Última atualização** | 2026-07-24 |

---

## 1. Endpoints Atuais — ✅ Confirmado

| Endpoint | Método | Auth | Descrição |
|---|---|---|---|
| `/session/sign-in` | POST | `@Public` | CPF+senha → sessão ou desafio OTP (`step: done \| otp_required`) |
| `/session/send-otp-code` | POST | `@Public` (cookie challenge) | Gera e envia código; PENDING_EMAIL → PENDING_CODE |
| `/session/verify-otp-code` | POST | `@Public` (cookie challenge) | Valida código → sessão |
| `/session/sign-out` | POST | Sessão | Revoga sessão atual |
| `/request/password/reset` | POST | `@Public` | Solicita reset (resposta neutra) |
| `/confirm/password/reset` | POST | `@Public` | Confirma reset; revoga todas as sessões |
| (validação de token de reset) | POST | `@Public` | `ValidateResetTokenUseCase` |

Convenções ✅: erros de domínio via `Either`, mensagens pt-BR prontas para UI, docs compostos Swagger (`@SignInDoc()` etc.), rotas não-`@Public` protegidas pelo `SessionGuard` global.

## 2. Endpoints Novos — 🎯 por fase

### Sessões e dispositivos (fase 4)

| Endpoint | Método | Auth | Descrição |
|---|---|---|---|
| `/sessions` | GET | Sessão | Lista sessões ativas (browser/os/ip/isCurrent) |
| `/sessions/:id` | DELETE | Sessão (dono) | Revoga um dispositivo |
| `/sessions` | DELETE | Sessão + step-up | Logout global |

### MFA (fase 6)

| Endpoint | Método | Auth | Descrição |
|---|---|---|---|
| `/mfa/factors` | GET | Sessão | Fatores ativos do usuário |
| `/mfa/totp/enroll` | POST | Sessão + step-up | Gera seed/QR (fator pendente) |
| `/mfa/totp/confirm` | POST | Sessão | Confirma e ativa; retorna recovery codes (única exibição) |
| `/mfa/webauthn/challenge` · `/mfa/webauthn/verify` | POST | Sessão / login | Cerimônias WebAuthn (registro e assertion) |
| `/mfa/factors/:id` | DELETE | Sessão + step-up | Desativa fator |
| `/mfa/recovery-codes/regenerate` | POST | Sessão + step-up | Invalida anteriores, gera novos |

### OAuth 2.1 / OIDC — Authorization Server (fase 7)

| Endpoint | Método | Padrão |
|---|---|---|
| `/.well-known/openid-configuration` | GET | OIDC Discovery |
| `/.well-known/jwks.json` | GET | RFC 7517 |
| `/oauth/authorize` | GET | RFC 6749 + PKCE (RFC 7636) |
| `/oauth/token` | POST | code/refresh grants |
| `/oauth/revoke` | POST | RFC 7009 |
| `/oauth/introspect` | POST | RFC 7662 (RS de terceiros) |
| `/oauth/userinfo` | GET | OIDC Core |

### Federação (fases 8-10)

| Endpoint | Método | Descrição |
|---|---|---|
| `/auth/:provider/authorize` | GET | Inicia fluxo no IdP externo (redirect) |
| `/auth/:provider/callback` | GET | Callback OIDC; vincula `Identity`, emite sessão local |
| `/identities` | GET | Identidades vinculadas do usuário |
| `/identities/:id` | DELETE | Desvincula (exige outro método de login ativo) |

## 3. Regras Transversais

1. **Nenhuma rota nova quebra as existentes** — clientes atuais seguem funcionando durante todas as fases (critério de aceite do [[18-Roadmap|Roadmap]]).
2. Erros de autorização: 401 (não autenticado) vs 403 (autenticado sem permissão) — nunca trocados.
3. Ações sensíveis marcadas "step-up" exigem re-desafio MFA ([[12-MFA]] §6).
4. Rotas de auth com `@Throttle()` dedicado ([[14-Seguranca]] §4).
5. Versionamento: aditivo (campos novos opcionais); mudança de contrato = rota nova, nunca mutação silenciosa da existente.

## Ver também

- [[README]] — índice
- [[07-Fluxos]]
- [[16-Eventos]]
