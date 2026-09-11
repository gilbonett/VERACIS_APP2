---
title: Segurança - Plataforma de Identidade
tags:
  - identity
  - auth
  - seguranca
  - owasp
  - nist
aliases:
  - Segurança IAM
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Segurança

| | |
|---|---|
| **Domínio** | [[README\|Plataforma de Identidade]] |
| **Código-fonte** | `apps/api/src/main.ts`, `infra/http/cookies/`, `infra/throttler/`, `infra/cryptography/` |
| **Última atualização** | 2026-07-24 |

---

## 1. Controles Confirmados no Código — ✅ (manter)

| Controle | Evidência |
|---|---|
| Cookies httpOnly + secure(prod) + sameSite lax + path | `cookie-options.ts:10-15` |
| `clearCookie` com opções idênticas ao set (senão navegador ignora) | `cookie.service.ts:38-50` |
| Helmet aplicado | `main.ts:64` |
| CORS single-origin com credentials | `main.ts:46-51` |
| `trust proxy: 1` calibrado — comentário no código explica que `true` permitiria spoof de `X-Forwarded-For` e bypass de rate limit | `main.ts:31-34` |
| Rate limit 3 camadas Redis-backed (sobrevive a restart, multi-instância) | `throttler.module.ts` |
| Secrets HMAC segregados por finalidade (SESSION/OTP/PASSWORD_RESET) | `hmac.service.ts:17-21` |
| Token de sessão CSPRNG 32B; só hash persistido | `hmac.service.ts:29`, [[11-Sessoes]] |
| Anti-enumeração no reset de senha | `request-password-reset.use-case.ts` |
| Revogação em cascata pós-reset | `confirm-password-reset.use-case.ts:62` |
| OTP com contador de tentativas e TTL | `otp-challenge.ts` |

## 2. Gaps Confirmados — priorizados

| Gap | Severidade | Correção |
|---|---|---|
| `User.status` não verificado no sign-in | 🔴 | 1 guard clause + testes (IDP-001) |
| Sem lockout por conta | 🔴 | §4 (IDP-002) |
| Rate limit não dedicado a rotas de auth | 🟠 | `@Throttle()` restritivo em sign-in/otp/reset (IDP-002) |
| bcrypt (não Argon2id), sem pepper | 🟠 | §3 (IDP-003) |
| Sem CSRF token explícito | 🟡 | §6 — risco residual pequeno, defesa em profundidade |
| CSP default do Helmet, HSTS não explícito | 🟡 | §5 |
| Sem auditoria | 🔴 (compliance) | [[13-Auditoria]] |

## 3. Armazenamento de Senha — Argon2id + Pepper (ADR-013)

- **Argon2id** com parâmetros mínimos OWASP Password Storage Cheat Sheet: `m=19456 KiB (19 MiB), t=2, p=1` — calibrar para cima até ~100–200ms no hardware de produção. Memory-hard: resistente a GPU/ASIC de forma que bcrypt não é.
- **Migração rehash-on-login**: `HashComparer` detecta algoritmo pelo prefixo do hash (`$2b$` vs `$argon2id$`); login bem-sucedido com hash bcrypt gera e persiste hash Argon2id. Sem reset em massa, sem downtime. Interfaces existentes (✅ `HashComparer`/`HashGenerator`) tornam a troca invisível aos use cases.
- **Pepper**: `HMAC-SHA256(pepper_key, password)` **antes** do Argon2id; `pepper_key` exclusivamente no AWS Secrets Manager (nunca no banco, nunca em env commitada). Ganho: dump isolado da tabela `users` não permite ataque offline sem o segredo da aplicação. Custo: mais um segredo com ciclo de rotação próprio (rotação de pepper exige re-hash on-login com versionamento do pepper — `pepperVersion` no hash metadata).
- Salt: embutido no Argon2id (por-hash, automático) — nunca manual.

## 4. Brute Force e Lockout — defesa em camadas

| Camada | Escopo | Mecanismo |
|---|---|---|
| 1 — IP global ✅ | Qualquer rota | Throttler atual (short/medium/long) |
| 2 — Rota sensível 🎯 | sign-in, send-otp, verify-otp, reset | `@Throttle()` dedicado, limites baixos (ex.: verify-otp 5/min — cada tentativa ataca 6 dígitos) |
| 3 — Conta 🎯 | Credential stuffing distribuído | Contador Redis `auth:failed:{userId}` com TTL deslizante; N falhas ⇒ cooldown (15min); resposta **idêntica** a senha incorreta (anti-enumeração); reset no sucesso; `ACCOUNT_LOCKED` na auditoria |
| 4 — Sinal 🎯 | Anomalia | IP/dispositivo divergente do histórico ⇒ step-up MFA, não bloqueio |

NIST SP 800-63B exige throttling de tentativas por conta — a camada 3 é a que fecha o requisito.

## 5. Headers e Transporte

- **HSTS** explícito: `Strict-Transport-Security: max-age=31536000; includeSubDomains` (Helmet config — hoje default). `preload` só após validar subdomínios.
- **CSP** customizada (o esboço de nonce já existe comentado em `main.ts:25-28` ✅): `default-src 'self'`, sem `unsafe-inline`, nonce para o Scalar em `/docs`.
- API JSON pura: `X-Content-Type-Options: nosniff` (Helmet ✅), sem necessidade de proteção de frame além do default.

## 6. CSRF e XSS

- **CSRF**: risco já reduzido por `sameSite: lax` + CORS single-origin com credentials ✅ — vetor residual é navegação GET top-level (que nunca deve ser mutável — semântica HTTP respeitada nos controllers ✅). Double-submit cookie como defesa em profundidade: avaliado, não urgente (task IDP-022, decisão registrada).
- **XSS**: tokens inacessíveis a JS (httpOnly) ✅ — o dano de XSS fica limitado a ações na sessão da vítima enquanto a página está aberta, não a roubo de credencial persistente. CSP (§5) reduz a própria execução.

## 7. Rotação de Segredos e Chaves

| Segredo | Rotação |
|---|---|
| `SESSION_SECRET` (HMAC) | Rotação exige janela dual-secret (validar com N e N-1) — implementar suporte a lista de secrets **antes** da primeira rotação; sem isso, rotação = logout global forçado (aceitável como plano B documentado) |
| `OTP_SECRET` / `PASSWORD_RESET_SECRET` | TTLs curtos (10min/1h) — rotação simples com janela dual mínima |
| Pepper | Versionado, re-hash on-login (§3) |
| Chaves JWT (fase 7) | Trimestral via `kid`/JWKS com sobreposição ([[10-Tokens]] §5) |
| Postura | Todos em AWS Secrets Manager; rotação auditada; nunca em log/trace |

## 8. Modos de Falha (fail-open × fail-secure)

| Dependência fora | Comportamento |
|---|---|
| Redis (cache de sessão) | **Fail-open para leitura** — valida via Postgres; latência sobe, login não cai |
| Redis (rate limit/lockout) | **Fail-secure parcial** — throttler sem estado degrada; lockout indisponível é risco aceito e **alarmado** (janela curta > indisponibilidade de login para todos) |
| Postgres | Indisponibilidade total de auth — mitigação é HA do RDS (multi-AZ), não gambiarra na aplicação |
| Fila de auditoria | Login segue; eventos re-tentados (DLQ); perda alarma |

## 9. Checklist ASVS (nível 1-2, resumo de aderência)

| Área | Estado |
|---|---|
| V6 Authentication | 🟡 — fecha com IDP-001/002/003 |
| V7 Session Management | 🟡 — fecha com teto absoluto + gestão de dispositivos |
| V8 Authorization | 🟡 — fecha com Task 15 + catálogo |
| V11 Cryptography | 🟡 — fecha com Argon2id/pepper |
| V16 Logging | ❌ — fecha com [[13-Auditoria]] |
| V14 Configuration | ✅ forte (secrets segregados, trust proxy correto) |

## Ver também

- [[README]] — índice
- [[00-Gap-Analysis]]
- [[12-MFA]] · [[13-Auditoria]]
- [[21-Referencias]]
