---
title: Segurança - Autorização
tags:
  - authorization
  - seguranca
  - owasp
aliases:
  - Segurança Autorização
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Segurança

| | |
|---|---|
| **Domínio** | [[README\|Plataforma de Autorização]] |
| **Última atualização** | 2026-07-24 |

---

## 1. Broken Access Control (OWASP Top 10 A01)

O estado atual **é** o A01 por omissão ([[00-Gap-Analysis]] §2.1): rotas sem verificação de papel. Defesas do desenho: deny by default (RN-001), enforcement server-side em toda operação (frontend só consome projeção — RNF/ASVS V8.2), teste de inventário de rotas sensíveis sem anotação ([[16-Testes]] §4), e 403 genérico sem vazamento de detalhe (RNF-08).

## 2. Escalação de Privilégio

| Vetor | Defesa |
|---|---|
| Auto-elevação (conceder papel a si mesmo) | Bloqueio no **use case** (não só UI), RN-010; tentativa auditada como `AUTHORIZATION_ADMIN_DENIED` |
| Elevação em cadeia (A concede a B que concede a A) | Administração exige ROOT/`authorization:manage` — conjunto pequeno e revisado trimestralmente ([[14-Auditoria]] §4); trilha com `grantedBy` reconstrói qualquer cadeia |
| Papel `isSystem` adulterado via API | Imutável por API (409); catálogo/grants de sistema só mudam por seed versionado em código (PR review) |
| Escalação horizontal (agir sobre recurso de outro no mesmo patamar) | Escopos OWN/COMMUNITY resolvidos contra o recurso real ([[09-Ownership]] §3), fail-closed quando o recurso não tem o atributo |
| Mass assignment elevando `role` no update de perfil | Validação Zod por DTO ✅ (campos explícitos) — `role`/atribuições nunca aceitos em endpoints de perfil; teste dedicado |

## 3. Confused Deputy

O risco: um componente privilegiado (a API, agindo como "deputy") executa em nome de um chamador menos privilegiado usando **a própria autoridade** em vez da do chamador. Defesas estruturais: toda decisão usa o **ator da sessão** (`AuthSession` — nunca um "usuário de sistema" implícito); jobs/subscribers que agem sem sessão declaram ator explícito (`grantedBy: "provider:scpa"`, `actor: system`) e têm permissões próprias mínimas; na fase de tokens, `aud` restringe onde cada token vale ([[Autenticacao/10-Tokens|Tokens]] §2) — um token emitido para a API pública não autoriza serviços internos.

## 4. Least Privilege e Separation of Duties

- **Least privilege**: default MEMBER ✅; grants ANY concentrados em MANAGER/ROOT; papel `auditor` prova que leitura ampla não exige poder de escrita ([[07-RBAC]] §4).
- **SoD (proposto, ativável)**: para ambientes que o exigirem (auditoria governamental), concessão de papéis ANY pode exigir **segundo aprovador** — o modelo suporta sem mudança de schema (assignment nasce `pending` em `metadata`, segundo ROOT confirma). Não construído por padrão — registrado como evolução com gatilho de compliance.

## 5. Defense in Depth

As três camadas **são** a defesa em profundidade: burlar o guard de borda (camada 1) ainda esbarra no grant (camada 2); um grant concedido em excesso ainda esbarra na policy contextual (camada 3); e a trilha de auditoria + métrica de negações ([[12-Eventos]]) detectam a tentativa. Nenhuma camada única é ponto de falha total.

## 6. Interação com a Segurança da Identidade

Autorização pressupõe os controles da [[Autenticacao/14-Seguranca|Identidade]] (sessão íntegra, lockout, status de conta). Nota de dependência: enquanto o gap de `User.status` no sign-in (IDP-001) não for fechado, uma conta BLOCKED autentica **e** — sem as camadas desta pasta — acessa tudo que qualquer autenticado acessa. Os dois gaps se compõem; fechar ambos é a Fase 1 dos dois roadmaps.

## Ver também

- [[README]] — índice
- [[03-Regras-de-Negocio]] · [[14-Auditoria]] · [[16-Testes]]
- [[Autenticacao/14-Seguranca|Segurança da Identidade]]
