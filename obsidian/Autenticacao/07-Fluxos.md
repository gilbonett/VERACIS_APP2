---
title: Fluxos - Plataforma de Identidade
tags:
  - identity
  - auth
  - fluxos
  - diagramas
aliases:
  - Fluxos IAM
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Fluxos

| | |
|---|---|
| **Domínio** | [[README\|Plataforma de Identidade]] |
| **Última atualização** | 2026-07-24 |

---

Cada fluxo indica se é ✅ atual (confirmado no código) ou 🎯 alvo. Os diagramas alvo já incluem as correções do [[00-Gap-Analysis|Gap Analysis]] (status check, lockout, auditoria).

## 1. Login (alvo — atual + correções)

```mermaid
flowchart TD
    A["POST /session/sign-in { cpf, password }"] --> T["Rate limit por rota 🎯<br/>+ lockout por conta 🎯"]
    T -->|excedido| E0["429 / erro genérico"]
    T --> B{"CPF válido e usuário existe?"}
    B -- não --> E1["401 InvalidCredentialsError<br/>+ AuditLog LOGIN_FAILED 🎯"]
    B -- sim --> S{"user.status == ACTIVED? 🎯"}
    S -- não --> E1
    S -- sim --> C{"Senha confere?<br/>(Argon2id alvo; rehash-on-login)"}
    C -- não --> E1
    C -- sim --> D{"MFA habilitado?"}
    D -- não --> F["Cria Session (7d deslizante, teto 30d 🎯)<br/>cookie httpOnly + AuditLog LOGIN_SUCCESS 🎯"]
    D -- sim --> G["Desafio MFA<br/>(e-mail OTP ✅ · TOTP/Passkey 🎯)<br/>cookie challenge (10min)"]
    G --> H["Verificação do fator<br/>(máx. 5 tentativas ✅)"]
    H -- falha --> E2["Erro + desafio expira na 6ª ✅"]
    H -- sucesso --> F
    F --> Z(["200 autenticado"])
```

## 2. Logout (unitário ✅ · por dispositivo/global 🎯)

```mermaid
sequenceDiagram
    participant C as Cliente
    participant API as Identity
    participant PG as sessions
    participant RD as Redis (cache)

    rect rgb(235,245,235)
    note over C,RD: Logout atual (sessão corrente) ✅
    C->>API: POST /session/sign-out
    API->>PG: DELETE sessão atual
    API->>RD: DEL cache da sessão 🎯 (síncrono — ADR-012)
    API-->>C: 200 + clearCookie
    end

    rect rgb(235,240,250)
    note over C,RD: Logout por dispositivo / global 🎯
    C->>API: DELETE /sessions/:id (dispositivo) ou DELETE /sessions (global)
    API->>API: valida propriedade (sessão pertence ao usuário)
    API->>PG: DELETE alvo(s)
    API->>RD: DEL cache correspondente (síncrono)
    API-->>C: 200 + AuditLog SESSION_REVOKED
    end
```

## 3. Refresh com Rotação (🎯 fase 7)

```mermaid
sequenceDiagram
    participant C as Cliente (não-cookie)
    participant AS as Authorization Server (interno)
    participant DB as refresh_tokens

    C->>AS: POST /oauth/token { grant_type: refresh_token }
    AS->>DB: busca por hash do token
    alt token já usado (familyId com reuso)
        AS->>DB: revoga TODA a família + sessão vinculada
        AS-->>C: 401 — reautenticação obrigatória (replay detectado)
        note over AS: AuditLog REFRESH_REUSE_DETECTED
    else primeiro uso válido
        AS->>DB: marca used=true, cria novo refresh na mesma família
        AS-->>C: { access_token JWT ES256 (≤15min), refresh_token novo }
    end
```

## 4. OAuth 2.1 — Authorization Code + PKCE (🎯 VERACIS consumindo IdP externo)

```mermaid
sequenceDiagram
    participant U as Usuário
    participant App as VERACIS (client confidencial)
    participant IdP as IdP externo (GOV.BR etc.)

    App->>App: code_verifier aleatório + code_challenge = S256(verifier)
    U->>App: "Entrar com GOV.BR"
    App->>IdP: redirect /authorize?client_id&code_challenge&state&redirect_uri
    U->>IdP: autentica no IdP
    IdP->>App: callback?code&state
    App->>App: valida state (anti-CSRF do fluxo)
    App->>IdP: POST /token { code, code_verifier, client_secret }
    IdP-->>App: { id_token, access_token, refresh_token }
    App->>App: valida id_token (JWKS do IdP, iss/aud/exp/nonce)
    App->>App: Provider mapeia claims → IdentityResult → vincula/cria Identity
    App->>App: emite Session local (token do IdP nunca vai ao navegador)
    App-->>U: cookie httpOnly VERACIS
```

PKCE obrigatório mesmo em client confidencial (OAuth 2.1); `state`+`nonce` contra CSRF/replay do fluxo (RFC 9700).

## 5. OIDC — VERACIS como Authorization Server (🎯 fase 7, se houver 2º sistema consumidor)

```mermaid
sequenceDiagram
    participant RP as Sistema Consumidor (Relying Party)
    participant AS as VERACIS Identity (AS/OP)
    participant U as Usuário

    RP->>AS: GET /.well-known/openid-configuration
    AS-->>RP: metadados (endpoints, JWKS URI, algs)
    U->>RP: acessa sistema consumidor
    RP->>AS: /authorize (code + PKCE)
    U->>AS: autentica (fluxo §1 — sessão VERACIS)
    AS->>RP: callback?code
    RP->>AS: POST /token
    AS-->>RP: { id_token ES256, access_token, refresh_token }
    RP->>AS: GET /jwks (cacheado, kid)
    RP->>RP: valida id_token localmente
```

## 6. MFA — TOTP e Passkey (🎯)

```mermaid
sequenceDiagram
    participant U as Usuário
    participant API as Identity

    rect rgb(235,245,235)
    note over U,API: Cadastro TOTP
    U->>API: POST /mfa/totp/enroll
    API-->>U: secret (QR) — MfaSecret confirmedAt=null
    U->>API: POST /mfa/totp/confirm { code }
    API->>API: valida TOTP (RFC 6238, janela ±1)
    API-->>U: fator ativo (confirmedAt) + recovery codes (exibidos 1 vez, armazenados como hash)
    end

    rect rgb(235,240,250)
    note over U,API: Login com Passkey (WebAuthn)
    U->>API: POST /mfa/webauthn/challenge
    API-->>U: challenge + allowCredentials
    U->>U: autenticador local (biometria/PIN) assina challenge
    U->>API: POST /mfa/webauthn/verify { assertion }
    API->>API: valida assinatura vs. chave pública registrada + origem
    API-->>U: fator satisfeito (resistente a phishing — AAL3)
    end
```

## 7. Password Reset (✅ atual — fluxo de referência)

```mermaid
sequenceDiagram
    participant U as Usuário
    participant API as Identity
    participant DB as password_resets

    U->>API: POST /request/password/reset { email }
    API->>DB: cria token (HMAC, TTL 1h, uso único)
    API-->>U: 200 genérico (anti-enumeração ✅)
    U->>API: POST /confirm/password/reset { token, newPassword }
    API->>DB: valida (não expirado, não usado) e consome
    API->>API: hash da nova senha
    API->>DB: deleteAllByUserId — revoga TODAS as sessões ✅
    API-->>U: 200 + AuditLog PASSWORD_RESET 🎯
```

## 8. Validação de Sessão em Escala (✅ núcleo · cache 🎯)

```mermaid
sequenceDiagram
    participant C as Cliente
    participant G as SessionGuard
    participant RD as Redis (cache TTL 60s)
    participant PG as sessions

    C->>G: request + cookie
    G->>G: sessionId = HMAC(rawToken)
    G->>RD: GET session:{id} 🎯
    alt cache hit
        RD-->>G: sessão (staleness máx. 60s — revogação invalida síncrono)
    else miss ou Redis fora
        G->>PG: findById (PK) ✅
        PG-->>G: sessão
        G->>RD: SET com TTL 60s 🎯
    end
    G->>G: isExpired? absoluteExpiresAt? 🎯
    G->>G: renewIfNeeded (escreve só nas últimas 24h ✅)
    G-->>C: 200 + cookie renovado ✅
```

## 9. Auditoria (🎯)

```mermaid
flowchart LR
    UC["Use cases da Identity"] -->|"domain events<br/>(já existem ✅)"| DE["Dispatcher"]
    DE --> SUB["AuditEventSubscriber 🎯"]
    SUB --> OB["Outbox (mesma tx do evento<br/>quando houver escrita)"]
    OB --> W["Audit Writer"]
    W --> PG[("audit_logs<br/>particionada por mês<br/>append-only")]
    PG -.export frio.-> S3[("S3/Glacier<br/>retenção longa")]
    TEL["correlationId/requestId<br/>(OTEL ✅)"] --> SUB
```

Falha na escrita de auditoria **nunca** bloqueia autenticação (fila com retry); perda de evento é alarmada, não silenciada — detalhes em [[13-Auditoria]] §4.

## Ver também

- [[README]] — índice (mapa de todos os diagramas)
- [[11-Sessoes]] · [[10-Tokens]] · [[12-MFA]] · [[13-Auditoria]]
- `diagrams/` — C4, deployment, canvases v1
