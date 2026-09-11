---
title: ADRs - Plataforma de Identidade
tags:
  - identity
  - auth
  - adr
aliases:
  - ADRs IAM
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Architecture Decision Records

| | |
|---|---|
| **Domínio** | [[README\|Plataforma de Identidade]] |
| **Formato** | Michael Nygard (Problema, Alternativas, Decisão, Consequências, Trade-offs, Referências) |
| **Última atualização** | 2026-07-24 |

| ADR | Título | Status |
|---|---|---|
| [[#ADR-001]] | Sessão opaca HMAC como mecanismo primário do cliente web | Aceita (implementada) |
| [[#ADR-002]] | Migração bcrypt → Argon2id via rehash-on-login | Proposta |
| [[#ADR-003]] | Provider Pattern (`IdentityProvider`) | Proposta |
| [[#ADR-004]] | Autorização híbrida em camadas | Aceita (camada 1) / Proposta (camada 3) |
| [[#ADR-005]] | Refresh Token Rotation com detecção de reuso por família | Proposta (fase 7) |
| [[#ADR-006]] | Identity Kernel no monolito modular; extração por critérios | Aceita |
| [[#ADR-007]] | Redis para rate limit; Postgres para sessão | Aceita (implementada) |
| [[#ADR-008]] | BFF + JWT ES256 apenas na camada federada (fases) | Proposta |
| [[#ADR-009]] | Sem policy engine externo (OPA/Cedar) por ora | Proposta |
| [[#ADR-010]] | Não adotar Keycloak/Auth0/Cognito como dono da identidade | Proposta |
| [[#ADR-011]] | Auditoria append-only via outbox, retenção LGPD | Proposta |
| [[#ADR-012]] | Cache de sessão em Redis com invalidação síncrona | Proposta |
| [[#ADR-013]] | Argon2id parametrizado + pepper versionado | Proposta |

---

## ADR-001 — Sessão opaca HMAC como mecanismo primário do cliente web

**Status**: Aceita (reflete decisão implementada; revalidada nesta proposta). **Problema**: mecanismo de sessão para SPA first-party com necessidade de revogação imediata. **Alternativas**: (a) JWT stateless — revogação antes do `exp` exige denylist, que reintroduz o estado que se queria evitar; (b) JWT+refresh — complexidade sem segundo cliente que a pague; (c) sessão opaca server-side — escolhida. **Decisão**: token 32B CSPRNG; hash HMAC-SHA256 (`SESSION_SECRET`) é a PK em `sessions`; claro só no cookie httpOnly. **Consequências**: revogação instantânea; consulta ao store por request (mitigada por ADR-012); sem superfície de parsing JWT. **Trade-offs**: não portátil para clientes sem cookie — resolvido pela camada federada (ADR-008), não trocando o mecanismo do web. **Referências**: RFC 9700 (OAuth Security BCP), IETF OAuth for Browser-Based Apps (padrão BFF), OWASP Session Management Cheat Sheet.

## ADR-002 — Migração bcrypt → Argon2id via rehash-on-login

**Status**: Proposta. **Problema**: bcrypt (✅ atual) não é memory-hard; OWASP recomenda Argon2id como primeira escolha. **Alternativas**: (a) manter bcrypt — sem urgência, mas uma geração atrás sem razão; (b) reset em massa — custo de UX injustificável; (c) scrypt — aceitável, mas não é a recomendação primária; (d) rehash-on-login — escolhida. **Decisão**: comparar detectando algoritmo pelo prefixo do hash; login bem-sucedido re-hasheia para Argon2id; fluxos novos (registro/reset) já nascem Argon2id. **Consequências**: migração gradual e invisível; usuários inativos permanecem bcrypt (aceitável — só o login expõe a senha em claro para re-hash). **Trade-offs**: dois algoritmos coexistem por tempo indeterminado; métrica de acompanhamento (`password LIKE '$argon2id$%'`). **Referências**: OWASP Password Storage Cheat Sheet; NIST SP 800-63B §5.1.1.2. Parâmetros e pepper: ADR-013.

## ADR-003 — Provider Pattern (`IdentityProvider`)

**Status**: Proposta. **Problema**: lógica de autenticação local acoplada ao `SignInUseCase`; federação futura (GOV.BR/SCPA/LDAP) exigiria ramificar o use case por provedor. **Alternativas**: (a) `if/switch` por provider no use case — escala mal, testabilidade ruim; (b) Passport strategies como abstração pública — acopla o domínio a uma lib; (c) interface própria `IdentityProvider` com `IdentityResult` normalizado, Passport permitido **dentro** de um provider — escolhida. **Decisão**: contrato em [[08-Providers]] §1; `authenticate()` nunca cria sessão (orquestrador único); registry dinâmico; checagens do VERACIS (status, lockout) no orquestrador. **Consequências**: provider novo = 1 classe + 1 registro, zero mudança fora; testável por contrato. **Trade-offs**: indireção a mais com um único provider hoje — extração do `LocalProvider` é refactor de código existente, custo baixo. **Referências**: ePING (interoperabilidade por padrões); princípio DIP já aplicado nos repositórios do projeto.

## ADR-004 — Autorização híbrida em camadas

**Status**: Aceita (camada 1 — herda decisão de time da Task 15) / Proposta (camada 3). **Problema**: zero autorização de borda hoje; demanda futura de granularidade fina e interop com perfis SCPA; Task 15 já decidiu hierarquia `@MinRole`. **Alternativas**: (a) substituir a hierarquia por catálogo completo agora — descarta design aprovado, sem regra de negócio que exija; (b) só hierarquia para sempre — fecha a porta da granularidade e do mapeamento SCPA; (c) camadas — escolhida. **Decisão**: camada 1 `@MinRole` hierárquico (borda, O(1)); camada 2 policies puras de domínio (✅ existem); camada 3 catálogo `recurso:ação` ativado onde exigido (fase 3). **Consequências**: nenhum conflito com trabalho em andamento; rota barata continua barata; ponte SCPA pronta. **Trade-offs**: duas camadas mentais — mitigado pela regra de ouro ("guard decide rota; domínio decide recurso"). **Referências**: NIST/INCITS 359 (RBAC); NIST SP 800-162 (ABAC); [[Análise Arquitetural - Alerts/tasks/15 - RBAC de permissionamento por roles/15 - RBAC de permissionamento por roles|Task 15]].

## ADR-005 — Refresh Token Rotation com detecção de reuso por família

**Status**: Proposta (fase 7). **Problema**: refresh de longa duração vazado = janela de meses. **Alternativas**: (a) refresh estático — janela inaceitável; (b) rotação sem detecção — reduz janela mas não detecta roubo ativo; (c) rotação + família + revogação em cadeia — escolhida. **Decisão**: cada uso invalida e emite sucessor na mesma `familyId`; reuso ⇒ revoga família + sessão; janela de graça de segundos para retry de rede legítimo. **Consequências**: vazamento limitado ao intervalo até o próximo refresh; roubo ativo detectado e auditado (`REFRESH_REUSE_DETECTED`). **Trade-offs**: estado por família; risco de falso positivo em corrida — testar explicitamente. **Referências**: RFC 9700 §4.14 (refresh token protection); OAuth 2.1 draft.

## ADR-006 — Identity Kernel no monolito modular; extração por critérios

**Status**: Aceita (estrutura atual ✅ revalidada, critérios adicionados). **Problema**: identidade como serviço físico separado desde já, ou módulo lógico? **Alternativas**: (a) microsserviço dia 1 — custo permanente de rede/deploy/observabilidade sem nenhum gatilho presente; (b) auth diluída em cada domínio — duplicação e inconsistência; (c) kernel lógico com fronteira rígida — escolhida. **Decisão**: módulo próprio, tabelas próprias, comunicação com o resto apenas por contratos e eventos; extração física somente quando ≥2 critérios dispararem ([[04-Arquitetura]] §4: segundo sistema consumidor, carga divergente, fronteira de compliance, divisão de time). **Consequências**: operação simples hoje; extração barata amanhã (a disciplina de fronteira é o investimento). **Trade-offs**: exige vigilância de fronteira (lint de imports entre módulos — mesma técnica da Task 12 dos Alerts). **Referências**: Fowler "MonolithFirst"; Newman, *Building Microservices*.

## ADR-007 — Redis para rate limit; Postgres para sessão

**Status**: Aceita (implementada ✅). **Problema**: onde vivem contadores de rate limit e sessões. **Alternativas**: rate limit em memória de processo — quebra multi-instância (limite × N réplicas); rate limit em Postgres — padrão de escrita de alta frequência com TTL não é o forte; sessão em Redis — perde durabilidade/backup sem ganho necessário. **Decisão**: throttler em Redis (`@nest-lab/throttler-storage-redis` ✅); sessão em Postgres. **Consequências**: rate limit correto em ECS multi-task; Redis fora ⇒ login continua (sessão não depende dele — até ADR-012, que mantém Postgres como verdade). **Trade-offs**: duas stores para conceitos vizinhos — padrões de acesso genuinamente diferentes justificam. **Referências**: —.

## ADR-008 — BFF + JWT ES256 apenas na camada federada (arquitetura em fases)

**Status**: Proposta. **Problema**: interoperar com OAuth 2.1/OIDC (GOV.BR, RPs futuros, mobile) sem abrir mão da segurança do modelo cookie/BFF nem construir Authorization Server sem consumidor. **Alternativas**: (a) migrar tudo para JWT agora — perde revogação imediata do web, ganha nada (sem consumidor); (b) PASETO — sem interop OIDC (GOV.BR fala JWT), ecossistema menor, contraria ePING; (c) Macaroons — sem história de federação; (d) fases — escolhida. **Decisão**: web permanece BFF/sessão opaca **permanentemente**; fase 7 adiciona AS interno emitindo access JWT **ES256** (perfil RFC 9068, claims em [[10-Tokens]] §2) + refresh opaco (ADR-005) + OIDC Discovery/JWKS, somente quando existir consumidor real. HS256 proibido (segredo compartilhado permitiria a qualquer RS emitir tokens). **Consequências**: cada cliente usa o mecanismo certo; nada é construído sem tráfego que o pague. **Trade-offs**: dois mecanismos coexistem na fase 7+ — unificados pelo vínculo `sessionId` nos claims (revogar sessão corta a família de tokens). **Referências**: RFC 8725 (JWT BCP); RFC 9068; RFC 9700; OAuth 2.1 draft; OIDC Core 1.0.

## ADR-009 — Sem policy engine externo (OPA/Cedar) por ora

**Status**: Proposta. **Problema**: adotar PDP centralizado (OPA/Rego, Cedar/Amazon Verified Permissions) para autorização? **Alternativas**: (a) OPA sidecar — runtime extra, latência por decisão, curva Rego, ganho de governança que nada hoje demanda; (b) Cedar/AVP — idem + acoplamento a serviço gerenciado; (c) policies como funções puras no domínio (✅ padrão existente) — escolhida. **Decisão**: manter policies em código, testáveis; catálogo de permissões (ADR-004) cobre a granularidade. **Gatilhos de revisão**: policies administradas por não-desenvolvedores; autorização compartilhada entre ≥2 serviços físicos; multi-tenant. **Consequências**: zero infra nova; policy = código revisado em PR. **Trade-offs**: sem hot-reload de policy nem UI de administração — aceitável no tamanho atual. **Referências**: NIST SP 800-162.

## ADR-010 — Não adotar Keycloak/Auth0/Cognito como dono da identidade

**Status**: Proposta. **Problema**: terceirizar a plataforma de identidade a um produto pronto? **Alternativas**: (a) Keycloak self-hosted — produto poderoso, mas passa a ser um sistema inteiro a operar/atualizar/endurecer (JVM, upgrades com breaking changes), e o modelo de domínio do VERACIS (CPF, comunidades, papéis próprios) viraria customização de terceiro; (b) Auth0/Cognito — custo por MAU, lock-in, dados de credencial de cidadão em SaaS — sensível para projeto com destino DATASUS; (c) plataforma própria sobre componentes padrão — escolhida. **Decisão**: identidade é domínio central do projeto e permanece interna; Keycloak/Auth0/Cognito continuam integráveis **como providers federados** ([[08-Providers]] §2 — alguém autentica *neles*), invertendo a relação. **Consequências**: controle total do modelo e do dado; custo de construir o que produtos dão pronto — mitigado pelo escopo em fases (só se constrói o que tem consumidor). **Trade-offs**: AS OIDC próprio (fase 7) é trabalho não-trivial — adiado até o gatilho, e o desenho já está pronto. **Referências**: ePING (soberania/padrões abertos); histórico de migrações caras de IdP SaaS.

## ADR-011 — Auditoria append-only via outbox, retenção LGPD

**Status**: Proposta. **Problema**: nenhuma trilha de auditoria ✅; exigência de compliance para plataforma governamental. **Alternativas**: (a) logs Pino como auditoria — sem imutabilidade/retenção de compliance; (b) escrita síncrona no caminho do login — acopla disponibilidade de auth à tabela de audit; (c) assíncrono com outbox — escolhida. **Decisão**: `AuditLog` append-only (repositório sem update/delete + `REVOKE UPDATE, DELETE` no banco), alimentada por subscriber dos domain events via fila com retry/DLQ; outbox quando o evento nasce de escrita transacional; partição mensal; export S3 Object Lock; retenção 12m quente + até 5 anos frio, **sujeita a validação DPO/jurídico**; direitos do titular respondidos por pseudonimização, nunca edição. **Consequências**: auth nunca bloqueia por auditoria; perda de evento alarma; imutabilidade garantida pelo banco. **Trade-offs**: janela de assincronia (segundos) entre fato e registro — aceitável para trilha. **Referências**: OWASP ASVS V16; LGPD arts. 7º, 16, 18; Marco Civil art. 15.

## ADR-012 — Cache de sessão em Redis com invalidação síncrona

**Status**: Proposta. **Problema**: em escala (milhões de usuários), uma consulta Postgres por request autenticado vira o maior consumidor de I/O do banco. **Alternativas**: (a) sessão movida para Redis — perde durabilidade/backup (contra ADR-007); (b) read replicas para sessão — replicação assíncrona introduz staleness inclusive para **revogação** (inaceitável); (c) cache read-through com invalidação explícita — escolhida. **Decisão**: Redis TTL 60s; miss/indisponibilidade cai para Postgres (fail-open de leitura); **toda revogação deleta a chave sincronamente** — staleness de TTL nunca se aplica a revogação; falha do DEL com Redis fora ⇒ exposição máxima de 60s, alarmada. **Consequências**: P99 de validação ≤10ms; Postgres aliviado do hot path. **Trade-offs**: janela de 60s se (e só se) a invalidação síncrona falhar — risco quantificado e aceito. **Referências**: complementa ADR-007.

## ADR-013 — Argon2id parametrizado + pepper versionado

**Status**: Proposta. **Problema**: parâmetros concretos do KDF e defesa contra dump isolado do banco. **Alternativas**: pepper por concatenação simples — frágil a length-extension conforme construção; sem pepper — dump da tabela permite ataque offline imediato; HMAC-pepper pré-hash — escolhida. **Decisão**: `Argon2id(HMAC-SHA256(pepper_key, password))` com `m=19 MiB, t=2, p=1` mínimo (OWASP), calibrado a ~100–200ms em produção; `pepper_key` só no Secrets Manager; `pepperVersion` registrado junto ao hash para rotação via re-hash-on-login. **Consequências**: dump do banco sem o segredo da aplicação não permite cracking offline; rotação de pepper possível sem reset em massa. **Trade-offs**: mais um segredo com ciclo de vida próprio; login um pouco mais caro (deliberado — é o custo de segurança). **Referências**: OWASP Password Storage Cheat Sheet; NIST SP 800-63B.

## Ver também

- [[README]] — índice
- [[00-Gap-Analysis]]
- [[21-Referencias]]
