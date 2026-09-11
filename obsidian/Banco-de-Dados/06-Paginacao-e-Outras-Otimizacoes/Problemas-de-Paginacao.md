---
title: Problemas de Paginação - Banco de Dados
tags:
  - database
  - performance
  - paginacao
  - refactor
aliases:
  - Problemas de Paginação
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Problemas de Paginação

| | |
|---|---|
| **Domínio** | [[Banco-de-Dados\|Banco de Dados]] |
| **Última atualização** | 2026-07-24 |

---

## 1. Padrão de referência já existe no projeto — 🟢

`NotificationRepository.findManyByRecipientId` implementa paginação por cursor corretamente:

```ts
const notifications = await this.prisma.notification.findMany({
  where: { recipientId, OR: [...] },
  orderBy: { createdAt: "desc" },
  take: limit + 1,
  skip: cursor ? 1 : 0,
  cursor: cursor ? { id: cursor } : undefined,
});
const hasMore = notifications.length > limit;
```

Busca `limit + 1` para saber se há próxima página sem um `COUNT(*)` extra, usa `cursor`/`skip: 1` em vez de `OFFSET` alto. **Este é o modelo a replicar** nos itens abaixo — não introduzir um segundo padrão de paginação (ex.: offset/limit) quando já existe um padrão de cursor testado no projeto.

## 2. `GET /alerts` sem paginação — 🔴 Confirmado, prioridade máxima

`AlertDetailsRepository.findMany` não tem `take`, `skip` nem `cursor` — busca **todos** os alertas que casam o filtro de status (e opcionalmente comunidade), sempre. É o endpoint de maior tráfego do sistema ([[Queries-Mais-Utilizadas]]) e a query com `include` mais pesado ([[Queries-Lentas-Documentadas]]). Sem paginação, o tamanho da resposta cresce linearmente com o total de alertas ativos — sem limite superior.

**Correção**: aplicar o mesmo padrão de cursor de `NotificationRepository`, ordenando por `createdAt desc` (que hoje nem está definido — ver achado em [[Banco-de-Dados]] seção 6). Exige adicionar `orderBy` e `cursor`/`take` em `IAlertDetailsQuery` e no controller/use-case (`GetAlertsUseCase`), além de ajustar o contrato de resposta da API (quebra de compatibilidade — comunicar ao frontend).

## 3. `findAll()` sem paginação em dados de referência — 🟡 Confirmado, prioridade menor hoje

| Repositório | Método | Endpoint exposto? |
|---|---|---|
| `CommunityRepository` | `findAll` | `GET /communities` (quando sem filtro de bioma) |
| `CategoryRepository` | `findAll` | `GET /categories` |
| `BiomeRepository` | `findAll` | `GET /biomes` |
| `RiskRepository` | `findMany` | `GET /risks` |
| `EventRepository` | `findAll` | uso interno, não mapeado a endpoint direto encontrado |
| `AttachmentRepository` | `findAll` | `GET /files` (escopo de uso não totalmente mapeado) |
| `SessionRepository`, `PasswordResetRepository`, `OtpChallengeRepository` | `findAll` | não expostos via HTTP — usados só internamente/testes |

Impacto atual **Hipótese**: são tabelas de dado de referência, hoje provavelmente pequenas (dezenas de linhas). O risco é de médio prazo — à medida que `communities`/`events`/`categories` crescerem (novos territórios, novos tipos de evento), a resposta sem paginação cresce sem controle. `sessions`/`password_resets`/`otp_challenges` têm `findAll` só por completude de interface (`Repository<T>` genérico) e não são chamados via HTTP — menor urgência ali.

**Correção**: para os endpoints HTTP expostos (`communities`, `categories`, `biomes`, `risks`), aplicar paginação por cursor ou, dado que são conjuntos pequenos e mudam pouco, considerar cache (ver [[Outras-Oportunidades]]) como alternativa complementar à paginação — um catálogo de referência cacheado no cliente ou no Redis não precisa da mesma urgência de paginação que um feed de alertas em crescimento constante.

## 4. Nenhum `OFFSET` com valor alto encontrado — 🟢

Não há paginação baseada em `skip`/`OFFSET` numérico em nenhum repositório — o problema aqui é ausência total de paginação, não paginação ineficiente por offset alto. Isso simplifica a correção: não é preciso migrar de offset para cursor, só é preciso **adicionar** paginação onde falta, usando cursor desde o início.

## Ver também

- [[Banco-de-Dados]] — índice
- [[Queries-Lentas-Documentadas]]
- [[Outras-Oportunidades]]
