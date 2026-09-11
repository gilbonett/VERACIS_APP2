---
title: Outras Oportunidades - Banco de Dados
tags:
  - database
  - performance
  - cache
  - refactor
aliases:
  - Outras Oportunidades (SELECT, Cache, Locks)
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Outras Oportunidades (SELECT, Cache, Locks)

| | |
|---|---|
| **Domínio** | [[Banco-de-Dados\|Banco de Dados]] |
| **Última atualização** | 2026-07-24 |

---

## 1. `SELECT *` implícito em métodos `findById` — 🟡 Confirmado, impacto Baixo-Médio

11 métodos `findById`/`findUnique` não declaram `select`, trazendo todas as colunas da tabela: `AlertComment`, `AlertReaction`, `Session`, `PasswordReset`, `OtpChallenge`, `Category`, `Biome`, `Event`, `Community`, `Attachment`, `Risk`. Na maioria dos casos o impacto é baixo — são linhas estreitas (poucas colunas, sem texto longo) — exceto:

- `PasswordReset`/`OtpChallenge`/`Session`: trazem `codeHash`/`password` implicitamente adjacentes não aqui, mas vale conferir se algum desses objetos é serializado direto em resposta HTTP em algum ponto (não confirmado neste levantamento — auditoria pontual recomendada antes de tratar como urgente).
- O `include: author: true` de `Alert`/`AlertComment` já coberto em [[Duplicidades-e-Oportunidades-de-Batch-Join]] é o caso mais crítico desta categoria — resolvido lá.

**Correção**: baixa prioridade isolada; resolver junto da correção de `include` do item acima quando o mesmo arquivo for tocado, em vez de abrir uma tarefa dedicada só para isso.

## 2. Ausência de cache em dados de referência — 🟡 Confirmado

`UserRepository.findById` é o único ponto do projeto com cache Redis (`apps/api/src/infra/database/prisma/users/repositories/prisma-user-repository.ts:22-34`, chave `users:${userId}`, invalidado em `save`/`invalidateProfileCache`). Nenhuma das tabelas de referência abaixo tem cache, mesmo sendo lidas com alta frequência e escritas raramente:

| Tabela | Frequência de leitura (hipótese) | Frequência de escrita |
|---|---|---|
| `categories` | Alta (toda tela de criação de alerta) | Muito baixa (admin) |
| `biomes` | Média | Muito baixa |
| `risks` | Média | Muito baixa |
| `events` | Média-Alta | Baixa |
| `communities` | Alta | Baixa |

**Correção**: replicar o padrão já validado em `UserRepository` (cache-aside com Redis, TTL + invalidação no `save`/`delete`) para essas 5 tabelas. Como mudam raramente, um TTL mais longo (ex.: 1h) é seguro. Reduz tanto o número de queries ao Postgres quanto o tamanho de resposta HTTP repetida para dado que praticamente não muda entre requisições.

## 3. Job de limpeza de sessões expiradas é um stub — 🟡 Confirmado

`OnCleanExpiredSessionTask` roda a cada hora (`@Cron(CronExpression.EVERY_HOUR)`) mas não executa nenhuma lógica de exclusão real — é um stub. `sessions` tem índice em `expiresAt` (bem pensado, pronto para o cleanup), mas sem o job funcionando, linhas expiradas nunca são removidas: a tabela cresce indefinidamente, o índice em `expiresAt` cresce com ela, e toda query em `sessions` (mesmo as que usam o índice) trabalha sobre uma tabela maior do que precisaria.

**Correção**: implementar a exclusão real:

```ts
await this.sessionRepository.deleteExpired(); // ou equivalente: prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } })
```

Não é urgente para a performance de leitura hoje (o índice em `expiresAt` já isola bem as linhas relevantes), mas é uma bomba-relógio de crescimento de tabela sem controle — mais barato resolver agora do que quando a tabela já estiver grande.

## 4. Transações e locks — 🟢 Nada crítico encontrado

Não foram encontradas transações longas nem padrões de lock explícito (`SELECT ... FOR UPDATE`, transações abrangendo chamadas de rede/fila) no código lido. As operações que tocam múltiplas tabelas (`AlertRepository.create`/`save`, que cria/atualiza `Alert` + `events`/`attachments`/`risks` em paralelo via `Promise.all`) usam chamadas independentes, não uma transação Prisma (`$transaction`) — o que é aceitável aqui porque as entidades filhas (`AlertEvent`, `Attachment`, `AlertRisk`) são associações, não dados críticos de consistência forte; uma falha parcial não deixa o `Alert` principal em estado inconsistente do ponto de vista de negócio. **Hipótese**: se o time notar inconsistências entre `Alert` e suas associações em produção, revisitar com `$transaction`.

## Ver também

- [[Banco-de-Dados]] — índice
- [[Duplicidades-e-Oportunidades-de-Batch-Join]]
- [[Problemas-de-Paginacao]]
