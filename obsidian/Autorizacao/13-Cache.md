---
title: Cache - Autorização
tags:
  - authorization
  - cache
  - redis
aliases:
  - Cache Autorização
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Cache

| | |
|---|---|
| **Domínio** | [[README\|Plataforma de Autorização]] |
| **Última atualização** | 2026-07-24 |

---

## 1. O Que É Cacheado

**`PermissionSet` por usuário** — chave `authz:pset:{userId}`, valor serializado: grants efetivos `{ key, scope, communityId? }[]` (piso do enum + atribuições ativas resolvidas). **Não** se cacheia decisão por recurso (`can` de um alerta específico) — o contexto do recurso muda por request e a avaliação sobre o set em memória é O(n) trivial.

## 2. Parâmetros

| Parâmetro | Valor | Racional |
|---|---|---|
| TTL | 300s | Teto de staleness **apenas para o caminho não-crítico** (evento perdido); mudanças reais invalidam sincronamente |
| Fallback | Redis fora ⇒ resolve do Postgres (1 query, índice `(userId, revokedAt)`) — **fail-open de leitura**, mesmo padrão do cache de sessão ([[Autenticacao/17-ADR|ADR-012]]) | Autorização nunca fica indisponível por causa do cache |
| Aquecimento | Lazy (primeiro `can` do usuário popula) | Sem warm-up job — churn baixo |

## 3. Invalidação (o ponto crítico)

| Gatilho | Mecanismo | Alcance |
|---|---|---|
| `UserRoleAssigned`/`UserRoleRemoved` | **Síncrona no use case** (DEL antes de retornar) + evento | 1 usuário |
| `RolePermissionsChanged` | DEL em lote dos usuários com o papel (`SCAN` por lista de userIds da query de assignments) — síncrono no use case administrativo | N usuários do papel |
| `MembershipChanged` (User) | Subscriber → DEL do usuário | 1 usuário |
| Mudança do **piso** (enum `User.role`) | Já invalida o cache de usuário ✅ (`users:{id}`); adicionar DEL do pset no mesmo fluxo | 1 usuário |

Regra herdada do ADR-012 e elevada a invariante: **staleness de TTL nunca se aplica a revogação** — revogar sem conseguir invalidar (Redis fora) é alarmado; teto de exposição = TTL (300s), risco aceito e documentado.

## 4. Sincronização Multi-instância

Redis é compartilhado (✅ ElastiCache) — DEL vale para todas as instâncias imediatamente. **Nenhum cache de processo** (in-memory por instância) é permitido para autorização: invalidação distribuída de cache local exigiria pub/sub e reintroduziria a inconsistência que o Redis central elimina. (Se um dia a latência exigir cache local, o desenho é TTL de segundos + pub/sub de invalidação — registrado como evolução, não construído.)

## 5. Observabilidade

Métricas: hit ratio, latência de resolução (miss), invalidações/min, `AuthorizationDenied`/min. Queda de hit ratio ou pico de invalidação = sinal operacional (churn administrativo anômalo, possível abuso).

## Ver também

- [[README]] — índice
- [[12-Eventos]] · [[03-Regras-de-Negocio]] RN-006
- [[Autenticacao/17-ADR|ADR-012 — cache de sessão (o template desta decisão)]]
