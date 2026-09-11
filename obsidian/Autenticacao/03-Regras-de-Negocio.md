---
title: Regras de Negócio - Plataforma de Identidade
tags:
  - identity
  - auth
  - regra-de-negocio
aliases:
  - Regras de Negócio IAM
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Regras de Negócio da Identidade

| | |
|---|---|
| **Domínio** | [[README\|Plataforma de Identidade]] |
| **Última atualização** | 2026-07-24 |

---

Catálogo das regras de negócio próprias da identidade. Regras cadastrais do usuário (registro, perfil, papéis, termos) vivem em [[Regras-de-Negocio/Usuarios/Usuarios|Regras de Negócio — Usuários]] e não são duplicadas aqui.

## 1. Autenticação Local

| Regra | Valor | Status |
|---|---|---|
| RN-A01 — Identificador de login | CPF (validado por VO `Cpf`) | ✅ Confirmado (`sign-in.use-case.ts:47`) |
| RN-A02 — Erro de credencial é sempre genérico | `InvalidCredentialsError` idêntico para CPF inexistente, sem senha, senha errada | ✅ Confirmado — anti-enumeração |
| RN-A03 — Conta não-ativa não autentica | `status !== ACTIVED` ⇒ recusa | 🎯 Proposto (gap crítico, [[00-Gap-Analysis]] §3.1) |
| RN-A04 — Lockout por conta | N falhas em T minutos ⇒ cooldown; resposta indistinguível de senha errada | 🎯 Proposto |

## 2. Senha

| Regra | Valor | Status |
|---|---|---|
| RN-S01 — Comprimento mínimo | 8 caracteres | ✅ Confirmado (`password.ts:6`) |
| RN-S02 — Composição mínima | ≥1 letra e ≥1 dígito | ✅ Confirmado (`password.ts:17`) |
| RN-S03 — Sem expiração periódica por calendário | Troca forçada só por evento de segurança | ✅ política atual, **mantida deliberadamente** — NIST SP 800-63B recomenda não forçar troca periódica (leva a senhas fracas previsíveis) |
| RN-S04 — Hash | bcrypt hoje; Argon2id alvo (rehash-on-login) | 🟡 / 🎯 (ADR-013) |
| RN-S05 — Sem histórico de reuso | Não implementado; avaliar apenas se exigência de compliance surgir | ✅ estado atual documentado |

## 3. OTP / MFA

| Regra | Valor | Status |
|---|---|---|
| RN-M01 — MFA é opt-in por usuário | `user.otpEnabled` | ✅ Confirmado |
| RN-M02 — TTL do desafio | 10 minutos | ✅ Confirmado (`otp-challenge.ts:144`) |
| RN-M03 — Máximo de tentativas | 5; na 6ª o desafio expira (`MaxOtpAttemptsError`) | ✅ Confirmado (`otp-challenge.ts:26,116`) |
| RN-M04 — Código nunca armazenado em claro | HMAC-SHA256 com `OTP_SECRET` dedicado | ✅ Confirmado |
| RN-M05 — Desafios anteriores expiram ao iniciar novo login | `expirePendingByUserId` | ✅ Confirmado |
| RN-M06 — Fatores adicionais (TOTP/Passkey) por usuário, com confirmação de ativação | fator só ativo após `confirmedAt` | 🎯 Proposto ([[12-MFA]]) |
| RN-M07 — Recovery codes de uso único, armazenados como hash | — | 🎯 Proposto |

## 4. Recuperação de Senha

| Regra | Valor | Status |
|---|---|---|
| RN-R01 — Resposta neutra | "Se o e-mail existir..." — nunca revela existência de conta | ✅ Confirmado |
| RN-R02 — TTL do token | 1 hora | ✅ Confirmado (`password-reset.ts:62`) |
| RN-R03 — Uso único | `usedAt` marcado na confirmação; reuso rejeitado | ✅ Confirmado |
| RN-R04 — Revogação em cascata | Confirmar reset **revoga todas as sessões** do usuário | ✅ Confirmado (`confirm-password-reset.use-case.ts:62`) |
| RN-R05 — Ao trocar senha logado (fluxo futuro), revogar demais sessões preservando a atual | — | 🎯 Proposto |

## 5. Sessão

| Regra | Valor | Status |
|---|---|---|
| RN-SE01 — TTL deslizante | 7 dias; renovação no banco só nas últimas 24h de vida | ✅ Confirmado (`session.ts:4-5,57-66`) |
| RN-SE02 — Cookie re-emitido a cada request autenticado | maxAge 7d | ✅ Confirmado (`session-guard.ts:66-69`) |
| RN-SE03 — Teto absoluto | 30 dias desde `createdAt`, independente de atividade | 🎯 Proposto ([[11-Sessoes]] §2) |
| RN-SE04 — Token em claro nunca persistido | Só o hash HMAC (que é a PK) | ✅ Confirmado |
| RN-SE05 — Logout revoga imediatamente | delete da linha | ✅ Confirmado (só sessão atual; global proposto) |

## 6. Autorização

| Regra | Valor | Status |
|---|---|---|
| RN-AU01 — Hierarquia estrita de papéis | ROOT ⊃ MANAGER ⊃ LEADER ⊃ MEMBER | ✅ Confirmado (enum); enforcement de borda planejado (Task 15) |
| RN-AU02 — Rota sem anotação = qualquer autenticado | adoção incremental, sem big-bang | 🎯 Planejado (Task 15) |
| RN-AU03 — Guard decide rota; domínio decide recurso | regra de ouro das duas camadas | 🎯 ver [[09-Autorizacao]] §2 |

## 7. Auditoria

| Regra | Valor | Status |
|---|---|---|
| RN-AD01 — Todo evento do catálogo gera registro imutável | sem update/delete | 🎯 Proposto ([[13-Auditoria]]) |
| RN-AD02 — Falha de login também é evento | inclusive por conta inexistente (userId null) | 🎯 Proposto |
| RN-AD03 — Correção nunca edita; cria novo evento referenciando o original | `metadata.correctionOf` | 🎯 Proposto |

## Ver também

- [[README]] — índice
- [[02-Requisitos]]
- [[07-Fluxos]]
- [[Regras-de-Negocio/Usuarios/Usuarios|Regras de Negócio — Usuários]]
