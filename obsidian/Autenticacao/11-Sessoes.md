---
title: Sessões - Plataforma de Identidade
tags:
  - identity
  - auth
  - sessoes
aliases:
  - Sessões IAM
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Sessões

| | |
|---|---|
| **Domínio** | [[README\|Plataforma de Identidade]] |
| **Código-fonte** | `apps/api/src/domain/auth/entities/session.ts`, `apps/api/src/infra/http/guards/session-guard.ts` |
| **Última atualização** | 2026-07-24 |

---

## 1. Mecânica Atual — ✅ Confirmado

- Token: 32 bytes CSPRNG; **`Session.id` = HMAC-SHA256(`SESSION_SECRET`, token)** — o claro só existe no cookie httpOnly; vazamento do banco não expõe tokens utilizáveis.
- TTL deslizante de 7 dias com otimização de escrita: `renewIfNeeded()` só escreve no banco nas **últimas 24h** de vida (`session.ts:57-66`); o cookie desliza a cada request (`session-guard.ts:66-69`). Desenho deliberado — evita um `UPDATE` por request autenticado.
- Sessão inválida/expirada ⇒ 401 + `clearCookie` com opções idênticas ao `set` (cuidado correto já implementado no `CookiesService`).

## 2. Sliding × Absolute — decisão

| Modelo | Trade-off | Uso |
|---|---|---|
| Absolute puro | Previsível, mas desloga usuário ativo — má UX em app de uso diário | Não usado |
| Sliding puro (**atual**) | UX ótima, mas sessão mantida "viva" artificialmente nunca expira | ✅ hoje |
| **Sliding + teto absoluto** | Renova por atividade **até** um máximo desde o login original | 🎯 **Escolhido** — `absoluteExpiresAt = createdAt + 30d`; força reautenticação periódica (OWASP Session Management Cheat Sheet: sessões devem ter timeout absoluto) sem punir o uso diário |

## 3. Validação em Escala — cache Redis (🎯 ADR-012)

Postgres permanece **fonte de verdade**; Redis é read-through cache com TTL curto (60s):

- Hit: valida da cópia em cache (staleness máx. 60s para renovação — irrelevante; **zero** staleness para revogação, ver §4).
- Miss ou Redis indisponível: cai para Postgres (PK lookup — barato). **Fail-open para leitura**: Redis fora não derruba login.
- Por que não sessão *em* Redis: perderia durabilidade/backup/replicação do Postgres para ganhar latência que o cache já entrega sem mudar a fonte de verdade (ADR-007 mantido, complementado por ADR-012).

## 4. Revogação — sempre síncrona nas duas camadas

Toda revogação (logout, logout global, bloqueio, reset de senha) executa: `DELETE` no Postgres **e** `DEL` da chave no Redis, na mesma operação. A janela de staleness do cache **não se aplica a revogação** — a invalidação é explícita, não por TTL. Se o `DEL` falhar (Redis fora), o TTL de 60s é o teto de exposição — registrado como risco aceito e alarmado.

Cascatas ✅/🎯:

| Gatilho | Efeito |
|---|---|
| Sign-out | Sessão atual ✅ |
| Reset de senha confirmado | **Todas** as sessões ✅ (`deleteAllByUserId`) |
| Troca de senha logado (futuro) | Todas menos a atual 🎯 |
| Conta bloqueada (`BLOCKED`) | Todas + evento `SESSIONS_REVOKED_GLOBALLY` 🎯 |
| Replay de refresh detectado (fase 7) | Família de tokens + sessão vinculada 🎯 |

"Blacklist" na fase atual **é o próprio session store** (token opaco: fora do store = inválido). Denylist adicional (`jti` em Redis) só entra com JWT na fase 7 ([[10-Tokens]] §7).

## 5. Dispositivos — 🎯

- `GET /sessions` — lista sessões do usuário: `{ id, createdAt, expiresAt, browser, os, ip, isCurrent }`; user-agent parseado por lib madura **na criação** da sessão, não a cada listagem.
- `DELETE /sessions/:id` — revoga um dispositivo (valida propriedade antes).
- `DELETE /sessions` — logout global explícito.
- `TrustedDevice` ([[12-MFA]] §5): dispositivo verificado pula MFA por período limitado — `fingerprint` + `expiresAt` (confiança **sempre** expira — Zero Trust).
- Notificação de novo dispositivo/localização via domínio Notification — sinal barato de account takeover.

## 6. Replay e Fixação

- **Fixação de sessão**: token só é gerado **após** autenticação bem-sucedida, nunca reaproveitado de estado anônimo ✅ — fixação estruturalmente impossível no desenho atual.
- **Replay do cookie**: cookie roubado é o risco residual de qualquer sessão por cookie — mitigado por httpOnly (XSS não lê), secure/HSTS (rede não intercepta), teto absoluto 🎯, e detecção de anomalia (IP/dispositivo divergente da sessão → sinal para step-up MFA 🎯).
- **Replay de refresh**: família + reuso ⇒ revogação em cadeia ([[10-Tokens]] §6).

## Ver também

- [[README]] — índice
- [[07-Fluxos]] §2, §8
- [[10-Tokens]]
- [[17-ADR]] — ADR-001, ADR-012
