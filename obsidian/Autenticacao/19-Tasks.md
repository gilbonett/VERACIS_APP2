---
title: Tasks - Plataforma de Identidade
tags:
  - identity
  - auth
  - tasks
  - backlog
aliases:
  - Backlog IAM
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Backlog Executável

| | |
|---|---|
| **Domínio** | [[README\|Plataforma de Identidade]] |
| **Última atualização** | 2026-07-24 |

---

Convenções: prioridade 🔴 Alta / 🟡 Média / 🟢 Baixa. Estimativas em dias de dev (ordem de grandeza). **DoD comum a todas**: código + testes verdes na suite completa, docs desta pasta atualizados se a implementação divergir do desenho, Swagger atualizado para rotas tocadas, sem novo warning de lint.

---

### IDP-001 — Verificar `User.status` no sign-in 🔴 · Fase 1 · ~1d

**Objetivo**: conta `DISABLED`/`BLOCKED` não autentica. **Dependências**: nenhuma. **Critério de aceite**: os 3 valores de `Status` testados; conta não-ativa recebe erro mesmo com senha correta; motivo distinto no evento de auditoria (quando existir).
- [ ] Decidir com produto: erro genérico × específico (senha já validada ⇒ específico aceitável)
- [ ] Guard clause em `sign-in.use-case.ts` após validação de senha
- [ ] Testes dos 3 status

### IDP-002 — Lockout por conta + throttle por rota 🔴 · Fase 1 · ~3d

**Objetivo**: deter credential stuffing distribuído; limites dedicados nas rotas de auth. **Dependências**: nenhuma. **Critério de aceite**: N falhas ⇒ cooldown 15min com resposta indistinguível de senha errada; `verify-otp` limitado a 5/min; reset de contador no sucesso.
- [ ] Contador Redis `auth:failed:{userId}` com TTL deslizante
- [ ] Cooldown verificado **antes** da comparação de senha
- [ ] `@Throttle()` em sign-in/send-otp/verify-otp/reset
- [ ] Testes de integração do lockout (incl. anti-enumeração)

### IDP-003 — Argon2id + pepper (rehash-on-login) 🔴 · Fase 1 · ~3d

**Objetivo**: ADR-002/013. **Dependências**: nenhuma (interfaces já abstraem). **Critério de aceite**: login com hash bcrypt legado funciona e re-hasheia; fluxos novos nascem Argon2id; latência de hash 100-200ms medida em produção-like.
- [ ] Avaliar build da lib `argon2` no Docker Node 24 Alpine
- [ ] `Argon2HashService` (`m=19MiB,t=2,p=1` calibrado) + pepper HMAC com `pepperVersion`
- [ ] Detecção de algoritmo por prefixo no `compare`
- [ ] Rehash-on-login + métrica de progresso

### IDP-004 — Interface `IdentityProvider` + registry 🟡 · Fase 2 · ~2d

**Objetivo**: contrato de [[08-Providers]] §1 e §3. **Dependências**: IDP-001/002 (checagens já no lugar certo). **Critério de aceite**: contrato + registry testados; nenhuma referência concreta fora do módulo de providers.
- [ ] `IdentityProvider`, `IdentityResult`, `ProviderRegistry`
- [ ] Testes de contrato com provider fake

### IDP-005 — Extrair `LocalProvider` 🟡 · Fase 2 · ~3d

**Objetivo**: `SignInUseCase` vira orquestrador. **Dependências**: IDP-004. **Critério de aceite**: comportamento externo idêntico (regressão); lógica de CPF/senha só no provider; status/lockout no orquestrador.
- [ ] Mover validação CPF+senha para `LocalProvider`
- [ ] Orquestrador: resolve provider → checagens → MFA → sessão
- [ ] Regressão completa dos fluxos de login

### IDP-006 — Teto absoluto de sessão 🟡 · Fase 4 · ~1d

**Objetivo**: `absoluteExpiresAt = createdAt + 30d`. **Critério de aceite**: sessão com atividade contínua expira aos 30d; migration com backfill (createdAt + 30d) para sessões vivas.
- [ ] Campo + migration + checagem no `ValidateSessionUseCase` + testes

### IDP-007 — Endpoints de sessões + logout global 🟡 · Fase 4 · ~3d

**Objetivo**: [[15-API]] §2. **Dependências**: IDP-006. **Critério de aceite**: listagem com browser/os/ip/isCurrent; revogar sessão alheia = 403; logout global exige step-up quando MFA ativo.
- [ ] `findManyByUserId` + parsing de UA na criação
- [ ] `GET /sessions`, `DELETE /sessions/:id`, `DELETE /sessions`
- [ ] Testes de propriedade e de revogação

### IDP-008 — Cache Redis de sessão 🟡 · Fase 4 · ~2d

**Objetivo**: ADR-012. **Dependências**: IDP-007 (revogações centralizadas). **Critério de aceite**: P99 de validação ≤10ms com cache; revogação efetiva ≤1s (teste de corrida); Redis fora ⇒ fallback Postgres transparente.
- [ ] Read-through TTL 60s + DEL síncrono em toda revogação
- [ ] Teste de corrida revogação × validação; teste de Redis indisponível

### IDP-009 — Domínio Audit + eventos de login 🔴 · Fase 5 · ~4d

**Objetivo**: [[13-Auditoria]]. **Dependências**: IDP-005 (orquestrador emite eventos). **Critério de aceite**: catálogo mínimo coberto; login não bloqueia com fila fora; `REVOKE UPDATE/DELETE` aplicado; partição mensal criada.
- [ ] Model `AuditLog` particionada + repositório append-only
- [ ] `LoginSucceededEvent`/`LoginFailedEvent` no orquestrador
- [ ] `AuditEventSubscriber` + fila BullMQ com DLQ
- [ ] Correlação com `correlationId`/`requestId` da telemetria

### IDP-010 — Política de retenção com DPO 🔴 · Fase 5 · ~2d (não-código)

**Objetivo**: validar prazos/bases legais de [[13-Auditoria]] §5. **Critério de aceite**: política assinada registrada na doc; job de export/pseudonimização configurado conforme.
- [ ] Reunião DPO/jurídico · registrar decisão · configurar export S3 Object Lock

### IDP-011 — TOTP + recovery codes 🟡 · Fase 6 · ~5d

**Objetivo**: AAL2 real. **Dependências**: IDP-009 (auditoria de MFA). **Critério de aceite**: enroll→confirm→login ponta a ponta; janela ±1 período; recovery de uso único com alerta; migração `otpEnabled` → `MfaSecret`.
- [ ] `MfaSecret` multi-tipo + migration de dados
- [ ] Enroll/confirm/login TOTP (RFC 6238) + recovery codes hasheados
- [ ] Step-up nas ações sensíveis

### IDP-012 — WebAuthn/Passkeys 🟡 · Fase 6-7 · ~8d

**Objetivo**: AAL3, resistência a phishing. **Dependências**: IDP-011. **Critério de aceite**: registro + assertion com `@simplewebauthn` (ou equivalente maduro); credencial vinculada à origem; fallback para TOTP/recovery.
- [ ] Cerimônias de registro e login · armazenamento de credencial em `MfaSecret(WEBAUTHN)` · testes

### IDP-013 — Corrigir/remover `OtpChallenge.expire()` 🟢 · Fase 1 · ~0.5d

Bug confirmado (seta `VERIFIED`), zero chamadores. **Critério de aceite**: corrigido com teste da transição → `EXPIRED`, ou removido — decisão registrada.
- [ ] Decidir · aplicar · testar

### IDP-014 — Limpeza real de sessões expiradas 🟢 · Fase 1 · ~0.5d

Cron é stub ✅. Já registrado também em [[Banco-de-Dados/tasks/00-To-Do-Geral|Banco de Dados]] (task 13) — executar uma vez, marcar nos dois.
- [ ] `deleteExpired()` + chamada no cron + verificação em produção

### IDP-015 — Refresh rotation com família 🟡 · Fase 7 · ~4d

**Objetivo**: ADR-005. **Dependências**: fase 7 iniciada (gatilho de negócio). **Critério de aceite**: reuso revoga família+sessão; janela de graça p/ retry testada; `REFRESH_REUSE_DETECTED` auditado.
- [ ] `RefreshToken` (hash PK, `familyId`) · rotação · detecção · testes de corrida

### IDP-016 — Entidade `Identity` (vínculo federado) 🟡 · Fase 8 · ~2d

**Critério de aceite**: `(provider, externalId)` único; conta local representada como `Identity(provider: local)`; desvincular exige método alternativo ativo.
- [ ] Model + migration + repositório + regras de vínculo/desvínculo

### IDP-017 — `OidcProvider` genérico 🟡 · Fase 8 · ~4d

**Critério de aceite**: parametrizável por issuer/client/scopes via Discovery; valida id_token via JWKS com allowlist de alg; Google funcionando como 1ª instância.
- [ ] Discovery + code+PKCE + validação id_token + mapeamento p/ `IdentityResult`

### IDP-018 — `GovBrProvider` 🔴 (estratégico) · Fase 10 · ~4d + credenciamento

**Critério de aceite**: homologação GOV.BR ponta a ponta; níveis Bronze/Prata/Ouro → `assuranceLevel`; vínculo por CPF.
- [ ] Credenciamento (iniciar cedo — prazo externo) · provider · homologação

### IDP-019 — `ScpaProvider` + mapeamento de perfis 🔴 (estratégico) · Fase 10 · ~5d

**Critério de aceite**: perfil SCPA refletido no catálogo de permissões; zero mudança em APIs de negócio.
- [ ] Levantar doc técnica SCPA (cedo) · provider · mapeamento perfil→Role

### IDP-020 — Catálogo de permissões (schema) 🟢 · Fase 3 · ~2d

**Critério de aceite**: `Role`/`Permission`/`RolePermission`/`UserRoleAssignment` criadas com índices; **nenhuma rota obrigada a usá-las** (ativação sob demanda).
- [ ] Migrations + repositórios + seed mínimo de permissões do domínio

### IDP-021 — Executar Task 15 (RolesGuard) 🔴 · Fase 3 · ~3d

Execução do desenho já pronto em [[Análise Arquitetural - Alerts/tasks/15 - RBAC de permissionamento por roles/15 - RBAC de permissionamento por roles|Task 15]] (passos 1-3 + decisão do passo 4). Não redesenhar — implementar.
- [ ] Passos 1-3 · anotar rotas staff · decisão role-por-comunidade registrada

### IDP-022 — Decisão CSRF token explícito 🟢 · Fase 9 · ~1d (+2d se implementar)

**Critério de aceite**: decisão registrada (implementar × aceitar risco residual, dado sameSite+CORS ✅); se implementar: double-submit + testes.

### IDP-023 — Rotação dual-secret do `SESSION_SECRET` 🟡 · Fase 9 · ~2d

**Critério de aceite**: HMAC valida contra lista [N, N-1]; rotação executada em staging sem logout em massa.
- [ ] Suporte a múltiplos secrets no `HmacService` · runbook de rotação

### IDP-024 — Decisão deps `passport*`/`@nestjs/jwt` 🟢 · Fase 8 (ou antes) · ~0.5d

**Critério de aceite**: decisão registrada; se remover: package.json+lockfile limpos, build verde; se manter: vinculadas a IDP-017.

## Ver também

- [[README]] — índice
- [[18-Roadmap]] — fases
- [[00-Gap-Analysis]] — origem dos itens
