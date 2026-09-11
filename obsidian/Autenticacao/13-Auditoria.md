---
title: Auditoria - Plataforma de Identidade
tags:
  - identity
  - auth
  - audit
  - lgpd
aliases:
  - Auditoria IAM
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Auditoria

| | |
|---|---|
| **Domínio** | [[README\|Plataforma de Identidade]] |
| **Última atualização** | 2026-07-24 |

---

> [!danger] 100% Proposto. ✅ Confirmado por busca no código: não existe trilha de auditoria dedicada — só logs Pino/OTEL (operacionais, sem garantia de retenção/imutabilidade) e domain events consumidos para e-mail. Para plataforma com destino governamental, isso é gap de compliance, não nice-to-have (OWASP ASVS V16; LGPD accountability).

## 1. Catálogo de Eventos

| Evento | Gatilho |
|---|---|
| `LOGIN_SUCCESS` / `LOGIN_FAILED` | Sign-in (falha inclui CPF inexistente — `userId` null — e conta bloqueada, com motivos distintos no `metadata`) |
| `LOGOUT` / `SESSION_REVOKED` / `SESSIONS_REVOKED_GLOBALLY` | Sign-out, revogação por dispositivo, global/cascata |
| `PASSWORD_CHANGED` / `PASSWORD_RESET_REQUESTED` / `PASSWORD_RESET` | Ciclo de senha |
| `TOKEN_REFRESH` / `TOKEN_REVOKED` / `REFRESH_REUSE_DETECTED` | Fase 7 |
| `MFA_ENABLED` / `MFA_DISABLED` / `MFA_CHALLENGE_FAILED` / `RECOVERY_CODE_USED` | Ciclo MFA |
| `ACCOUNT_LOCKED` / `ACCOUNT_UNLOCKED` | Lockout automático ou administrativo |
| `ROLE_CHANGED` / `PERMISSION_CHANGED` | Autorização |
| `IDENTITY_LINKED` / `IDENTITY_UNLINKED` | Vínculo de provider federado |
| `TRUSTED_DEVICE_ADDED` / `TRUSTED_DEVICE_REMOVED` | Dispositivos |

Cada registro: `eventType`, `userId?`, `provider`, `result`, `ip`, `userAgent` (browser/SO parseados), localização quando disponível, `sessionId?`, `correlationId`, `requestId`, `metadata` (json por tipo), `createdAt`. **Sem `updatedAt`, sem update, sem delete.** Correção = novo evento com `metadata.correctionOf`.

## 2. Pipeline — Outbox a partir dos Domain Events

Diagrama em [[07-Fluxos]] §9. Pontos de projeto:

1. **Reaproveita o canal existente** ✅ — `PasswordChangedEvent`, `OtpCodeRequestedEvent` etc. já são emitidos; o `AuditEventSubscriber` é mais um consumidor. Eventos novos a criar: `LoginSucceeded`/`LoginFailed` (hoje o sign-in não emite nada em falha).
2. **Nunca no caminho crítico**: escrita de auditoria assíncrona (fila BullMQ dedicada com retry + DLQ — infraestrutura já dominada pelo projeto ✅). Falha de escrita alarma, não bloqueia login.
3. **Outbox** onde o evento nasce junto de escrita transacional (ex.: criação de sessão): registro do evento na mesma transação, publicação posterior — elimina a janela "sessão criada mas evento perdido".
4. **Correlação grátis**: `correlationId`/`requestId` já existem na telemetria ✅ — o subscriber os anexa; auditoria cruza com traces do Tempo sem trabalho novo.

## 3. Imutabilidade

- Repositório expõe **apenas** `create` e leituras. Nenhum caminho de update/delete no código.
- Reforço no banco: `REVOKE UPDATE, DELETE ON audit_logs FROM app_role` — imutabilidade garantida pelo Postgres, não só por disciplina de código.
- Export frio (S3 com Object Lock, modo compliance) para retenção longa e prova de não-adulteração.

## 4. Particionamento e Volume

`audit_logs` particionada por mês (range em `createdAt`) **desde a primeira migration** — lição direta da auditoria de [[Banco-de-Dados/Banco-de-Dados|Banco de Dados]] (tabelas nascendo sem índice/estratégia). Consultas típicas (`userId + intervalo`) indexadas por partição; partições antigas exportadas e removidas do Postgres quente conforme política de retenção.

## 5. Retenção e LGPD

| Aspecto | Diretriz |
|---|---|
| Base legal | Art. 7º LGPD — obrigação legal/regulatória e legítimo interesse (segurança, prevenção a fraude — art. 7º IX) |
| Mínimo legal | Marco Civil (Lei 12.965/2014, art. 15): guarda de logs de aplicação por **6 meses** — piso, não teto |
| Proposta | 12 meses "quente" (Postgres) → export frio até 5 anos → descarte. **Validar com DPO/jurídico antes de fixar** — prazos de sistemas do MS podem impor mais |
| Minimização | `sub`/userId no lugar de CPF; IP é dado pessoal — incluído por necessidade de segurança, documentado no registro de operações |
| Direitos do titular × imutabilidade | Eliminação (art. 18) não se aplica a dados mantidos por obrigação legal/segurança (art. 16) enquanto durar a base — resposta ao titular: **pseudonimização** do histórico além do prazo, nunca edição do registro |
| Acesso | Leitura de auditoria é ela própria ação privilegiada e auditada (`resource: audit` no catálogo de permissões) |

> [!warning] Prazos e bases legais acima são proposta arquitetural — a palavra final é do jurídico/DPO do projeto. O desenho (particionamento + export + pseudonimização) suporta qualquer prazo que for definido sem retrabalho.

## Ver também

- [[README]] — índice
- [[07-Fluxos]] §9
- [[16-Eventos]]
- [[06-Modelo-de-Dados]]
