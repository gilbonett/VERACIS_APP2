---
title: ADRs - Autorização
tags:
  - authorization
  - adr
aliases:
  - ADRs Autorização
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Architecture Decision Records — Autorização

| | |
|---|---|
| **Domínio** | [[README\|Plataforma de Autorização]] |
| **Formato** | Nygard + Plano de migração (Problema, Alternativas, Decisão, Consequências, Trade-offs, Migração, Referências) |
| **Pais** | ADR-004 e ADR-009 da [[Autenticacao/17-ADR\|Identidade]] — as decisões abaixo os detalham |

| ADR | Título | Status |
|---|---|---|
| [[#ADR-AZ-01]] | Motor em 3 camadas aditivas; hierarquia é piso | Proposta |
| [[#ADR-AZ-02]] | Grant-only, deny by default, sem permissões negativas | Proposta |
| [[#ADR-AZ-03]] | Motor próprio; CASL avaliado e adiado com gatilhos | Proposta |
| [[#ADR-AZ-04]] | Escopo (OWN/COMMUNITY/ANY) como coluna do grant | Proposta |
| [[#ADR-AZ-05]] | Cache de PermissionSet em Redis, invalidação síncrona | Proposta |
| [[#ADR-AZ-06]] | Trilha de auditoria unificada (sem PermissionAudit própria) | Proposta |
| [[#ADR-AZ-07]] | Organização = Comunidade; multi-org adiado | Proposta |

---

## ADR-AZ-01 — Motor em 3 camadas aditivas; hierarquia é piso

**Problema**: compor a hierarquia existente (✅ enum, Task 15) com permissão fina e contexto sem dois sistemas concorrentes. **Alternativas**: (a) só hierarquia — não expressa `auditor`/SCPA/composições; (b) migrar tudo para catálogo — descarta design aprovado, toda rota pagaria consulta; (c) camadas aditivas — escolhida. **Decisão**: camada 1 `@MinRole` (borda, O(1)); camada 2 catálogo com escopo, **incluindo o piso do enum traduzido em grants implícitos** ([[07-RBAC]] §3) para o motor operar sobre uma única união; camada 3 policies puras. **Consequências**: nenhuma camada substitui outra; pergunta barata continua barata. **Trade-offs**: fixture piso→grants a manter sincronizada com produto (testada). **Migração**: Task 15 primeiro (zero tabela); catálogo depois, opt-in por rota. **Referências**: INCITS 359; NIST SP 800-162; ADR-004 (Identidade).

## ADR-AZ-02 — Grant-only, deny by default

**Problema**: semântica de conflito entre regras. **Alternativas**: (a) allow+deny com precedência (deny-overrides) — expressivo, mas cria a classe inteira de bugs de ordenação e ambiguidade de auditoria; (b) grant-only — escolhida. **Decisão**: permissão efetiva = união dos grants; ausência é a única negação; policies só restringem contexto, nunca "des-concedem" (RN-002/009); qualquer erro do motor nega. **Consequências**: decisão sempre explicável ("faltou grant X" ou "policy Y negou"); sem arbitragem de precedência. **Trade-offs**: "todos menos fulano" exige remodelar grants (remover de fulano), não negar — se requisito real de negação surgir, novo ADR. **Migração**: n/a (nasce assim). **Referências**: INCITS 359 (sem permissões negativas); ASVS V8.1.

## ADR-AZ-03 — Motor próprio; CASL avaliado e adiado

**Problema**: escolher o motor de `can()`. **Alternativas**: comparação completa em [[10-CASL-ou-Estrategia]] §2 (CASL, ACL, matrix, engine externa, próprio). **Decisão**: `AbilityService` próprio + policies puras. CASL rejeitado **por ora** por três fatos do projeto: domínio proibido de depender de framework ([[Geral]] §3) e as policies já são puras ✅; conditions-as-data não compram nada quando policies são código versionado (ADR-009); o único diferencial (frontend) é coberto por `GET /me/abilities`, com `AbilityProjection` desenhada isomórfica a rules CASL para adoção futura na borda sem retrabalho. **Gatilhos de reavaliação**: avaliação condicional local rica no frontend; explosão de policies contextuais. **Consequências**: zero dependência externa no caminho de decisão; padrão de teste já dominado. **Trade-offs**: construímos ~300 linhas que a lib daria — pagas uma vez, sem lock-in no núcleo de segurança de projeto com handover governamental. **Migração**: n/a. **Referências**: docs CASL (avaliadas); [[Análise Arquitetural - Alerts/tasks/15 - RBAC de permissionamento por roles/15 - RBAC de permissionamento por roles|Task 15 Passo 5]] (mesma conclusão em escopo menor); ADR-009 (Identidade).

## ADR-AZ-04 — Escopo como coluna do grant

**Problema**: expressar ownership/organização. **Alternativas**: (a) sufixo no nome (`alert:update:own`) — explode o catálogo (3× permissões), mistura "o quê" com "até onde", quebra a naming convention; (b) só policies de ownership — funciona, mas o alcance deixa de ser administrável/visível por grant; (c) coluna `scope` no assignment — escolhida. **Decisão**: `UserRoleAssignment.scope ∈ {OWN, COMMUNITY, ANY}` com continência (RN-005), `communityId` quando COMMUNITY; resolução contra `Ownable` do recurso, fail-closed. **Consequências**: catálogo estável; alcance visível na administração e na projeção de abilities. **Trade-offs**: resolução de escopo exige atributos do recurso — o use case já os carrega (nenhuma query extra). **Migração**: n/a. **Referências**: padrão scoped-grants comum em IAM gov (perfis regionais SCPA seguem semântica análoga).

## ADR-AZ-05 — Cache de PermissionSet em Redis, invalidação síncrona

**Problema**: resolver grants por request sem uma query por decisão. **Alternativas**: (a) sem cache — 1 query/decisão, desnecessário; (b) permissões embutidas na sessão — invalidação de mudança administrativa viraria revogação de sessão (efeito colateral desproporcional); (c) claims no token — só faz sentido na fase de tokens, e mesmo lá com TTL curto; (d) cache dedicado — escolhida. **Decisão**: `authz:pset:{userId}`, TTL 300s, invalidação síncrona no use case de mudança + evento para observadores; fallback Postgres fail-open de leitura ([[13-Cache]]). **Consequências**: P99 ≤5ms; revogação efetiva na requisição seguinte (RN-006). **Trade-offs**: teto de 300s se a invalidação síncrona falhar com Redis fora — alarmado, mesmo risco quantificado do ADR-012. **Migração**: entra junto com a camada 2. **Referências**: ADR-012 (Identidade — template).

## ADR-AZ-06 — Trilha de auditoria unificada

**Problema**: auditar concessões — trilha própria (`PermissionAudit`) ou a da plataforma? **Alternativas**: (a) tabela própria — consultas específicas mais diretas, mas duas trilhas = duas políticas de retenção/imutabilidade e divergência inevitável; (b) unificada — escolhida. **Decisão**: eventos de autorização entram no `AuditLog` da plataforma ([[Autenticacao/13-Auditoria|Auditoria]]) com `eventType` próprios ([[14-Auditoria]] §2); histórico estrutural adicional já existe no modelo (soft-revoke em `UserRoleAssignment`). **Consequências**: uma política de retenção/LGPD, uma garantia de imutabilidade, correlação nativa com eventos de identidade (login do concessor na mesma trilha). **Trade-offs**: consultas de autorização filtram uma tabela maior — resolvido por índice em `eventType` + partições. **Migração**: n/a. **Referências**: ADR-011 (Identidade).

## ADR-AZ-07 — Organização = Comunidade; multi-org adiado

**Problema**: o escopo pedido inclui Organization/Department/Team/herança organizacional. **Alternativas**: (a) construir hierarquia organizacional genérica — entidades sem correspondência no domínio real (YAGNI clássico); (b) mapear no que existe — escolhida. **Decisão**: a unidade organizacional do VERACIS é a **Comunidade** ✅; escopo COMMUNITY é o mecanismo; `Department`/`Team`/herança organizacional não são construídos. **Gatilhos**: multi-instituição na mesma instância (⇒ `tenant` da Identidade + hierarquia real) ou sub-grupos por comunidade. **Consequências**: zero entidade especulativa; a decisão pendente da Task 15 Passo 4 (papel por comunidade) encaixa como caso particular do escopo COMMUNITY — as duas decisões convergem em vez de competir. **Trade-offs**: se multi-org vier, haverá migração — aceita conscientemente contra o custo certo de manter hierarquia vazia por anos. **Referências**: Task 15 Passo 4; princípio YAGNI já normativo no projeto.

## Ver também

- [[README]] — índice
- [[Autenticacao/17-ADR|ADRs da Identidade]] — ADR-004, ADR-009, ADR-011, ADR-012
