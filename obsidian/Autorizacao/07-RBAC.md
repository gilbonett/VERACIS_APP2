---
title: RBAC - Autorização
tags:
  - authorization
  - rbac
aliases:
  - RBAC VERACIS
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# RBAC — Hierarquia (Camada 1) + Catálogo (Camada 2)

| | |
|---|---|
| **Domínio** | [[README\|Plataforma de Autorização]] |
| **Última atualização** | 2026-07-24 |

---

## 1. Duas Formas de RBAC, Um Modelo

O VERACIS usa RBAC (NIST/INCITS 359) em duas formas complementares: **hierarquia fixa** (enum ✅, para o patamar de borda) e **papéis de catálogo** (🎯, para composição fina). Não são dois sistemas — o piso hierárquico é traduzido em grants implícitos e entra na mesma união de permissões (RN-003).

## 2. Camada 1 — Hierarquia na Borda (Task 15, executar como desenhado)

`@MinRole(role)` + `RolesGuard` global registrado **após** o `SessionGuard`; hierarquia `ROOT ⊃ MANAGER ⊃ LEADER ⊃ MEMBER`; handler sobrescreve classe (`getAllAndOverride`); `@Public` + `@MinRole` = guard ignora; 403 nunca 401. Spec completa (decorator, guard, registro, 6 cenários de teste, semântica de patamar, escape hatch `@AllowRoles` a criar **só** se surgir conjunto não-contíguo) em [[Análise Arquitetural - Alerts/tasks/15 - RBAC de permissionamento por roles/Passo 2 - MinRole decorator e RolesGuard|Task 15 — Passo 2]]. **Esta pasta não duplica o desenho — executa** (task AUTHZ-001).

## 3. Piso da Hierarquia como Grants Implícitos

Para o `AbilityService` tratar tudo como união de grants, cada patamar mapeia para permissões implícitas — documentado aqui como **tabela normativa** (testada como fixture):

| Patamar | Grants implícitos (escopo) |
|---|---|
| MEMBER | `alert:create` (—), `alert:react` (—), `alert:comment` (—), `alert:read` (—), `alert:update` (OWN), `attachment:create` (OWN), `settings:*` (OWN), `notification:read` (OWN) |
| LEADER | MEMBER + `alert:accept` (COMMUNITY*), `community:view-metrics` (COMMUNITY*) |
| MANAGER | LEADER + `alert:accept` (ANY), `community:manage` (ANY), `category:manage` (ANY), `report:*` (ANY), `user:read` (ANY) |
| ROOT | MANAGER + `user:block` (ANY), `authorization:manage` (ANY), `audit:read` (ANY) |

*\* LEADER com escopo COMMUNITY depende da decisão pendente de papel-por-comunidade ([[Análise Arquitetural - Alerts/tasks/15 - RBAC de permissionamento por roles/Passo 4 - Decisao role por comunidade|Task 15 — Passo 4]]): enquanto a decisão for "papel global" (Cenário A), o escopo efetivo de LEADER é ANY. A tabela acima já expressa o Cenário B — a mudança futura é **um valor na fixture**, não um redesenho.*

> [!warning] Esta tabela é proposta inicial derivada das regras de negócio documentadas ([[Regras-de-Negocio/Alertas/Alertas|Alertas]]: quem aceita, quem modera) — validar linha a linha com produto antes do seed (task AUTHZ-004). O que estiver errado aqui vira bug de autorização.

## 4. Camada 2 — Papéis de Catálogo

Papéis nomeados que agregam permissões além do piso, atribuíveis com escopo:

| Papel (exemplos de seed) | Grants | Uso |
|---|---|---|
| `auditor` | `audit:read`, `audit:export`, `report:view` — tudo ANY, **somente leitura** | Auditoria externa/controle — acesso amplo de leitura sem poder de mutação (caso clássico que a hierarquia não expressa: mais leitura que MANAGER, menos escrita que MEMBER) |
| `community-manager` | `community:manage`, `alert:accept`, `community:view-metrics` (COMMUNITY) | Gestão delegada de uma comunidade específica sem elevar o papel global |
| `health-analyst` | `alert:read` (ANY, incluindo saúde), `report:export` | Perfil de análise do MS — futuro mapeamento SCPA |

Um usuário acumula: piso do enum + N atribuições de catálogo — sempre união (RN-002/003).

## 5. Papéis Vindos de Provider Externo (SCPA)

Quando a integração SCPA vier (fase 10 da [[Autenticacao/18-Roadmap|Identidade]]): o `ScpaProvider` traduz perfil SCPA → `Role.key` do catálogo por tabela de mapeamento explícita e versionada dentro do provider (RN-012). A atribuição resultante entra como `UserRoleAssignment` com `grantedBy = "provider:scpa"` — auditável como qualquer concessão. Perfil sem mapeamento ⇒ nenhum grant. O motor de decisão não muda uma linha.

## 6. Vantagens/Desvantagens do Desenho

| Vantagem | Custo aceito |
|---|---|
| Hierarquia continua O(1) na borda — rota staff não paga consulta | Duas formas de RBAC para o time entender (mitigado: uma pergunta por camada, [[04-Arquitetura]] §4) |
| Catálogo aditivo — zero migração do enum, zero big-bang | Tabela de grants implícitos a manter em sincronia com produto (testada como fixture) |
| `auditor`/SCPA expressáveis sem tocar hierarquia | — |

## Ver também

- [[README]] — índice
- [[06-Modelo-de-Dados]] — naming convention e seed
- [[09-Ownership]] — escopos
- [[10-CASL-ou-Estrategia]] — como o motor consome isto
