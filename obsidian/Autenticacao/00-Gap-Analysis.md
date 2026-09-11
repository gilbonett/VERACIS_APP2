---
title: Gap Analysis - Plataforma de Identidade
tags:
  - identity
  - auth
  - gap-analysis
  - arquitetura
aliases:
  - Gap Analysis
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Gap Analysis — Arquitetura Atual vs. Proposta

| | |
|---|---|
| **Domínio** | [[README\|Plataforma de Identidade]] |
| **Base da análise** | Leitura direta do código em 2026-07-24 (nenhuma suposição) |
| **Última atualização** | 2026-07-24 |

---

## 1. Resumo Executivo

A base atual é **melhor do que o comum** para migrar rumo a uma plataforma de identidade: Clean Architecture/DDD reais (use cases não tocam Prisma, contratos abstratos, `Either`, domain events), sessão server-side com HMAC bem implementada, fluxo de password reset exemplar, observabilidade forte (OTEL + decorators). Os gaps são de **escopo** (autorização, auditoria, MFA multi-fator, providers, tokens federados não existem) e **três falhas pontuais de segurança** (status de conta não verificado no login, ausência de lockout por conta, bcrypt em vez de Argon2id). A estratégia geral é **evoluir, não reescrever** — a maior parte do código atual vira a fase "Foundation" do [[18-Roadmap|Roadmap]] com refatorações cirúrgicas.

## 2. Tabela Consolidada

| # | Área | O que existe (✅ Confirmado) | Funciona? | Veredito | Migração |
|---|---|---|---|---|---|
| 1 | Mecanismo de sessão | Token opaco 32B, HMAC-SHA256 (`SESSION_SECRET`), hash = PK em `sessions` (Postgres), cookie httpOnly | ✅ Sim | **Manter e evoluir** — é o padrão BFF recomendado pelo IETF (RFC 9700); adicionar teto absoluto + cache Redis | Sem quebra; [[11-Sessoes]] |
| 2 | Sign-in | `SignInUseCase` CPF+senha direto no use case (`sign-in.use-case.ts:41-88`) | 🟡 Parcial | **Refatorar** — não verifica `User.status` (DISABLED/BLOCKED autenticam!); extrair `LocalProvider` | 2 passos: fix status (urgente), depois Provider ([[08-Providers]]) |
| 3 | Hash de senha | bcrypt (`bcryptjs ^3.0.3`) via `BcryptHashService`; interfaces `HashComparer`/`HashGenerator` já abstraem | ✅ Sim | **Substituir por Argon2id** — rehash-on-login, sem reset em massa; interfaces existentes tornam a troca trivial | [[14-Seguranca]] §3, ADR-013 |
| 4 | MFA | OTP e-mail 6 dígitos, máquina de estados `OtpChallenge` (5 tentativas, 10min TTL), opt-in por usuário | ✅ Sim | **Manter como 1º fator; generalizar** para `MfaSecret` multi-tipo (TOTP → Passkeys) | [[12-MFA]]; bug em `expire()` (seta VERIFIED, código morto) a corrigir |
| 5 | Password reset | Token HMAC 1h uso único, resposta anti-enumeração, **revoga todas as sessões** ao confirmar | ✅ Sim | **Manter — código de referência.** Melhor fluxo da base atual; usar como template para `EmailVerificationToken` | Nenhuma |
| 6 | Autorização | Enum `UserRole` global (MEMBER<LEADER<MANAGER<ROOT); zero guard de role; checks ad-hoc no domínio | ❌ Não (borda inexistente) | **Implementar em 2 camadas** — `@MinRole` (Task 15, já desenhada) + catálogo `recurso:ação` preparado | [[09-Autorizacao]]; não conflita com Task 15 |
| 7 | Auditoria | Inexistente — só logs Pino + OTEL (operacional, não trilha de compliance) | ❌ Não existe | **Criar domínio** — append-only, outbox a partir dos domain events já existentes | [[13-Auditoria]] |
| 8 | Rate limit / brute force | Throttler global por IP (Redis-backed, 3 camadas), `trust proxy` calibrado corretamente | 🟡 Parcial | **Evoluir** — falta limite por rota sensível e lockout por conta (credential stuffing distribuído passa) | [[14-Seguranca]] §4 |
| 9 | Tokens / OAuth / OIDC | Inexistente. `@nestjs/jwt`, `passport*` instalados **sem uso** | ❌ Não existe | **Fase 7 do roadmap** — AS interno OAuth 2.1 quando houver consumidor real; decidir destino das deps mortas | [[10-Tokens]], ADR-008 |
| 10 | Providers / federação | Inexistente — autenticação local acoplada ao use case | ❌ Não existe | **Provider Pattern** — `IdentityProvider` + `LocalProvider` primeiro, GOV.BR/SCPA depois | [[08-Providers]], ADR-003 |
| 11 | Cookies/CORS/Headers | httpOnly+secure+sameSite lax, CORS single-origin com credentials, Helmet default, `trust proxy: 1` | ✅ Sim | **Manter e endurecer** — CSP customizada, HSTS explícito, avaliar CSRF token (defesa em profundidade) | [[14-Seguranca]] §5-6 |
| 12 | Gestão de sessões/dispositivos | Sign-out revoga só a sessão atual; sem listagem, sem logout global, sem trusted devices | ❌ Não existe | **Criar endpoints** `GET/DELETE /sessions` + parsing de user-agent | [[11-Sessoes]] §5 |
| 13 | Limpeza de sessões expiradas | Cron horário existe mas é **stub** (nenhuma exclusão real) | ❌ Não | **Implementar** — `deleteMany(expiresAt < now)`; já registrado em [[Banco-de-Dados/tasks/00-To-Do-Geral\|Banco-de-Dados]] | Trivial |
| 14 | Observabilidade | OTEL SDK, decorators (`ObserveGuard`, `ObserveCryptography`, `ObserveSpan`), Pino estruturado, correlação | ✅ Forte | **Reusar** — `correlationId`/`requestId` alimentam a auditoria sem reinventar | [[13-Auditoria]] §4 |
| 15 | Estrutura DDD/Clean | Use cases → contratos abstratos → infra; `Either`; entidades ricas (`Session.renewIfNeeded`, `OtpChallenge.verifyCode`); domain events + subscribers | ✅ Forte | **Base ideal** — todos os domínios novos ([[05-Dominios]]) seguem exatamente este padrão | Nenhuma |

## 3. Detalhamento dos Gaps Críticos

### 3.1 `User.status` ignorado no login — 🔴 corrigir antes de qualquer outra coisa

✅ Confirmado: `sign-in.use-case.ts` valida CPF, existência, senha e `otpEnabled` — nunca lê `user.status`. Conta `BLOCKED` (fraude, violação) autentica normalmente. **Impacto**: o controle administrativo de bloqueio é inócuo. **Migração**: 1 `if` + testes (task IDP-001 em [[19-Tasks]]); zero quebra de contrato.

### 3.2 Lockout por conta inexistente — 🔴

Throttle por IP não detém credential stuffing distribuído (N IPs × 1 conta). **Proposta**: contador Redis por conta (`auth:failed:{userId}`), cooldown após N falhas, resposta indistinguível de senha incorreta (anti-enumeração), evento `ACCOUNT_LOCKED` para auditoria. Alinhado a OWASP ASVS V6 (Authentication) e NIST SP 800-63B (throttling de tentativas).

### 3.3 Autorização de borda inexistente — 🟠

Zero `ForbiddenException` sistemático; papel verificado ad-hoc dentro do domínio com duplicação (`MANAGER || ROOT` em 2+ lugares). A solução já está desenhada e checklistada em Task 15 (`@MinRole` + `RolesGuard`) — esta documentação **absorve e estende** (camada fine-grained futura), não redesenha. Ver [[09-Autorizacao]].

### 3.4 Dependências instaladas sem uso — 🟡

`@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `passport-google-oauth20`: zero referência no fluxo ativo. Ou viram base dos providers da Fase 8, ou saem do `package.json` (superfície de ataque e build). Decisão registrada como task IDP-024.

## 4. O Que Reusar Integralmente (não reescrever)

1. **`HmacService`** — já segrega secrets por tipo de token (`SESSION_SECRET`/`OTP_SECRET`/`PASSWORD_RESET_SECRET`); serve refresh tokens futuros com um novo tipo.
2. **`CookiesService` + `DEFAULT_COOKIE_OPTIONS`** — corretos, incluindo o cuidado com opções idênticas no `clearCookie`.
3. **Máquina de estados `OtpChallenge`** — generaliza para MFA multi-fator sem redesenho.
4. **Padrão de revogação em cascata** do reset de senha — replicar em bloqueio de conta e troca de senha logada.
5. **Domain events + subscribers** — canal pronto para o outbox de auditoria.
6. **Interfaces de criptografia** (`HashComparer`/`HashGenerator`/`HmacGenerator`) — a migração Argon2id não toca nenhum use case.
7. **Telemetria** — correlação de auditoria reaproveita `correlationId`/`requestId` existentes.

## 5. O Que Remover

| Item | Motivo |
|---|---|
| `OtpChallenge.expire()` | Código morto com bug (seta `VERIFIED` em vez de `EXPIRED`) — corrigir se ganhar chamador, remover se não |
| `PrismaUserRepository.findByPhone` | Fora do contrato abstrato, zero chamadores (já registrado em [[Banco-de-Dados/Banco-de-Dados\|Banco de Dados]]) |
| Deps `passport*`/`@nestjs/jwt` | Se a decisão da task IDP-024 for "sem plano de curto prazo" |
| Índice `users_email_cpf_phone_idx` | Redundante e mal ordenado (já task no Banco-de-Dados) |

## Ver também

- [[README]] — índice
- [[04-Arquitetura]] — arquitetura-alvo
- [[18-Roadmap]] — fases de migração
- [[19-Tasks]] — backlog derivado deste gap analysis
