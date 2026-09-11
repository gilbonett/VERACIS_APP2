---
title: Regras de Negócio - Autorização
tags:
  - authorization
  - regra-de-negocio
aliases:
  - RN Autorização
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Regras de Negócio

| | |
|---|---|
| **Domínio** | [[README\|Plataforma de Autorização]] |
| **Última atualização** | 2026-07-24 |

---

Cada regra: descrição, justificativa, impacto de implementação.

## RN-001 — Negação por padrão

**Descrição**: acesso é negado a menos que uma regra ativa o permita (hierarquia suficiente, grant do catálogo, ou policy). **Justificativa**: fail-closed é o único default seguro (ASVS V8.1); "esqueci de proteger" vira 403, não vazamento. **Impacto**: o `AbilityService` retorna `false` em qualquer caminho não coberto, inclusive erro interno; testes cobrem o caminho "nenhuma regra se aplica".

## RN-002 — Grants são aditivos; não existem permissões negativas

**Descrição**: a permissão efetiva é a **união** de tudo que as camadas concedem. Não há "DENY" explícito que subtraia. **Justificativa**: modelos com negação exigem ordem de precedência (deny-overrides etc.) — classe inteira de bugs e de ambiguidade de auditoria; NIST RBAC não tem permissão negativa. **Impacto**: se surgir requisito de "todos menos fulano", a resposta é remover o grant/papel de fulano, nunca criar negação; se um requisito genuíno de negação aparecer, é gatilho de novo ADR, não de gambiarra.

## RN-003 — A hierarquia é piso, nunca teto

**Descrição**: o papel hierárquico (`MEMBER<LEADER<MANAGER<ROOT`) garante um conjunto mínimo; papéis do catálogo **adicionam**, jamais subtraem do piso. **Justificativa**: coerência com RN-002; um MANAGER nunca "perde" capacidade por ganhar um papel de catálogo — elimina a pergunta "qual camada vence?" (nenhuma vence: união). **Impacto**: o mapeamento piso→permissões implícitas é documentado em [[07-RBAC]] §3 e testado como tabela.

## RN-004 — Rota sem exigência declarada = qualquer autenticado

**Descrição**: ausência de `@MinRole`/`@RequirePermission` significa "todo autenticado pode" — comportamento atual preservado. **Justificativa**: adoção incremental sem big-bang (decisão da Task 15); proteger é ato explícito e revisável em PR. **Impacto**: risco de omissão mitigado por teste de inventário ([[16-Testes]] §4) que lista rotas sensíveis sem anotação.

## RN-005 — Escopo do grant: OWN ⊂ COMMUNITY ⊂ ANY

**Descrição**: todo grant de catálogo tem escopo. `OWN` = só recursos de que o ator é dono; `COMMUNITY` = recursos das comunidades do ator; `ANY` = global. Escopo maior inclui o menor. **Justificativa**: expressa ownership e organização sem poluir o nome da permissão (`alert:update` + escopo, não `alert:update:own`) — o catálogo fica estável enquanto o alcance varia por papel. **Impacto**: resolução de escopo consulta membership do ator e o dono/comunidade do recurso ([[09-Ownership]]).

## RN-006 — Mudança de papel/grant tem efeito na próxima requisição

**Descrição**: conceder/revogar invalida imediatamente o cache do usuário afetado; a requisição seguinte já reflete o novo estado. **Justificativa**: revogação lenta é falha de segurança (funcionário desligado, papel removido por incidente). **Impacto**: invalidação síncrona no mesmo fluxo da mudança + evento para consumidores ([[13-Cache]] §3); teste de corrida obrigatório.

## RN-007 — Revogação de papel hierárquico rebaixa, não remove acesso ao próprio dado

**Descrição**: usuário rebaixado a MEMBER mantém acesso OWN aos recursos que criou. **Justificativa**: rebaixamento administra privilégio, não confisca autoria; evita estados órfãos. **Impacto**: escopo OWN nunca depende de papel.

## RN-008 — Troca/saída de comunidade afeta escopo COMMUNITY imediatamente

**Descrição**: grants de escopo COMMUNITY seguem a membership atual — sair da comunidade remove o alcance sobre os recursos dela. **Justificativa**: o vínculo é o fundamento do acesso; acesso residual pós-saída é vazamento. **Impacto**: mudança de membership também invalida o cache de permissões (evento `MembershipChanged` a emitir pelo domínio User — dependência registrada).

## RN-009 — Conflito entre policies não existe: composição é E-lógico por pergunta

**Descrição**: quando mais de uma regra se aplica à mesma decisão, camada 2 responde "tem o grant no escopo?" e camada 3 responde "o contexto permite?" — a decisão final exige ambas verdadeiras (dentro de cada camada, grants são união — RN-002). **Justificativa**: sem precedência configurável não há conflito a arbitrar — a semântica é fixa e auditável. **Impacto**: policies nunca "concedem" o que o grant não deu; só restringem contexto (ex.: alerta CLOSED não aceita reação, mesmo com `alert:react`).

## RN-010 — Administrar autorização é a ação mais privilegiada do sistema

**Descrição**: CRUD de papéis do catálogo, grants e atribuições exige ROOT ou `authorization:manage` (escopo ANY). Ninguém altera o próprio conjunto de papéis. **Justificativa**: anti-escalação ([[15-Seguranca]] §2). **Impacto**: guard dedicado nas rotas de [[11-API]]; auto-atribuição bloqueada no use case (não só na UI) e testada.

## RN-011 — Toda mudança de autorização é auditada com autor e motivo

**Descrição**: concessão/revogação registra quem, quando, o quê, motivo (campo obrigatório na API) e origem (`correlationId`, IP, sessão). **Justificativa**: revisão de acesso e resposta a incidente exigem a cadeia de custódia dos privilégios. **Impacto**: eventos de [[12-Eventos]] alimentam a trilha única ([[14-Auditoria]]); API rejeita mutação sem `reason`.

## RN-012 — Papéis de provider externo nunca entram crus

**Descrição**: perfis SCPA (ou de qualquer IdP) são traduzidos para papéis do catálogo por mapeamento explícito e versionado dentro do provider; papel desconhecido ⇒ nenhum grant (RN-001). **Justificativa**: Provider Agnostic ([[Autenticacao/08-Providers|Providers]]) — o motor nunca interpreta vocabulário alheio. **Impacto**: tabela de mapeamento por provider, testada; mudanças auditadas como concessão.

## Ver também

- [[README]] — índice
- [[02-Requisitos]]
- [[09-Ownership]] · [[13-Cache]] · [[15-Seguranca]]
