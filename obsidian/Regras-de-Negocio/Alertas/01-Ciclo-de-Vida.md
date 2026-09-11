---
title: Ciclo de Vida do Alerta
tags:
  - regra-de-negocio
  - alertas
  - ciclo-de-vida
aliases:
  - Status do Alerta
  - Alert Lifecycle
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Ciclo de Vida do Alerta

| | |
|---|---|
| **Domínio** | [[Alertas]] |
| **Código-fonte** | `apps/api/src/domain/alerts/entities/alert.ts` |
| **Última atualização** | 2026-07-22 |

---

## 1. Estados

Um alerta possui quatro status possíveis:

| Status | Significado |
|---|---|
| `PENDING` | Aguardando confirmação da comunidade |
| `ACCEPTED` | Confirmado pela comunidade ou criado diretamente por papel de liderança |
| `REJECTED` | Existe no modelo, sem fluxo de negócio que o dispare hoje (ver seção 3) |
| `CLOSED` | Encerrado — manualmente ou por expiração automática |

## 2. Transições Válidas

Ver [[Regras-de-Negocio/Alertas/Canvas/Alertas - Maquina de Estados.canvas|mapa da máquina de estados]] para a versão visual.

- `[*] → PENDING`: criação por usuário com papel `MEMBER`. Ver [[02-Criacao-de-Alertas]].
- `[*] → ACCEPTED`: criação por usuário com papel `LEADER`, `MANAGER` ou `ROOT`. Ver [[02-Criacao-de-Alertas]].
- `PENDING → ACCEPTED`: confirmação comunitária via reações. Ver [[03-Confirmacao-Comunitaria]].
- `PENDING → CLOSED`: expiração automática após 45 minutos sem confirmação. Ver [[05-Expiracao-Automatica]].
- `ACCEPTED → CLOSED`: expiração automática após 30 minutos de aceite (apenas quando o alerta nasce `ACCEPTED`), ou fechamento manual fora do escopo deste domínio. Ver [[05-Expiracao-Automatica]].

## 3. Estado sem fluxo: REJECTED

> [!warning] REJECTED é um estado órfão
> O método `Alert.doReject()` está implementado na entidade e altera `status` para `REJECTED`, mas **nenhum caso de uso do domínio o invoca**. Uma busca por `doReject()` em todo `apps/api/src` retorna apenas a própria definição do método.
>
> Na prática, um alerta pendente que não é confirmado a tempo não é rejeitado — ele é fechado (`CLOSED`) pela expiração automática (seção 2). Rejeição manual explícita (por exemplo, um líder recusar um alerta) não está implementada no domínio atual.

Antes de assumir que existe um fluxo de rejeição em produção, confirme com o time de produto se esse é um requisito futuro pendente de implementação ou um artefato de modelagem sem uso.

## 4. Invariantes

- Todo alerta nasce com um status definido na criação — não existe estado intermediário de "rascunho".
- Não existe transição de volta (`CLOSED` nunca retorna a `PENDING` ou `ACCEPTED`).
- As transições automáticas por expiração são idempotentes: o caso de uso de expiração verifica o status atual antes de fechar, evitando fechar um alerta que já mudou de estado por outro caminho. Ver [[05-Expiracao-Automatica]].

## Ver também

- [[Alertas]] — índice do domínio
- [[02-Criacao-de-Alertas]]
- [[03-Confirmacao-Comunitaria]]
- [[05-Expiracao-Automatica]]
- [[10-Erros-de-Dominio]]
