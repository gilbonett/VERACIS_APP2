---
title: Requisitos - Alertas
tags:
  - regra-de-negocio
  - alertas
  - requisitos
  - requisitos-funcionais
  - requisitos-nao-funcionais
aliases:
  - Requisitos Funcionais e Não Funcionais - Alertas
  - Alert Requirements
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Requisitos

| | |
|---|---|
| **Domínio** | [[Alertas]] |
| **Código-fonte** | `apps/api/src/domain/alerts/` |
| **Última atualização** | 2026-07-22 |

---

## 1. Sobre esta página

Requisitos são extraídos das regras de negócio já documentadas neste domínio, reescritos em formato testável (o que o sistema **deve** garantir, e sob que condição) — não repetem a narrativa das páginas de regra, apontam para elas. Todo domínio novo documentado no vault segue este mesmo padrão: uma página `Requisitos.md` própria, dentro da pasta do domínio, com requisitos funcionais (RF) e não funcionais (RNF) na mesma página.

## 2. Requisitos Funcionais

| ID | Requisito | Regra de origem |
|---|---|---|
| RF01 | O sistema deve permitir que um `MEMBER` crie um alerta com status inicial `PENDING` | [[02-Criacao-de-Alertas]] |
| RF02 | O sistema deve aceitar automaticamente (`ACCEPTED`) todo alerta criado por `LEADER`, `MANAGER` ou `ROOT` | [[02-Criacao-de-Alertas]] |
| RF03 | O sistema deve associar os eventos informados ao alerta na criação, mesmo que a lista seja vazia | [[02-Criacao-de-Alertas]] |
| RF04 | O sistema deve associar riscos ao alerta na criação apenas quando a lista informada não for vazia | [[02-Criacao-de-Alertas]] |
| RF05 | O sistema deve permitir que cada usuário reaja (`LIKE`/`DISLIKE`) uma única vez por alerta | [[03-Confirmacao-Comunitaria]] |
| RF06 | O sistema deve recusar reações em alertas que não estejam `PENDING` | [[03-Confirmacao-Comunitaria]] |
| RF07 | O sistema deve aceitar o alerta automaticamente quando a reação vier de um usuário com papel diferente de `MEMBER`, independentemente do tipo de reação | [[03-Confirmacao-Comunitaria]] |
| RF08 | O sistema deve aceitar o alerta com uma única reação `LIKE` quando o autor da reação estiver na lista de confirmação única | [[03-Confirmacao-Comunitaria]] |
| RF09 | O sistema deve aceitar o alerta automaticamente quando o total de reações `LIKE` de membros comuns atingir 5 | [[03-Confirmacao-Comunitaria]] |
| RF10 | O sistema não deve fechar, rejeitar ou alterar o status do alerta em função de reações `DISLIKE` | [[03-Confirmacao-Comunitaria]] |
| RF11 | O sistema deve restringir a visibilidade de alertas da categoria saúde ao autor e a usuários com papel `LEADER`, `MANAGER` ou `ROOT` | [[04-Visibilidade-Alertas-Saude]] |
| RF12 | O sistema deve responder com "alerta não encontrado" (não com erro de permissão) quando um usuário sem acesso tentar visualizar, comentar ou reagir a um alerta de saúde | [[04-Visibilidade-Alertas-Saude]] |
| RF13 | O sistema deve permitir comentários em alertas independentemente do status, respeitando a visibilidade de alertas de saúde | [[06-Comentarios]] |
| RF14 | O sistema deve permitir associar um anexo já existente a um alerta | [[07-Anexos]] |
| RF15 | O sistema deve fechar automaticamente um alerta `PENDING` que não for confirmado em até 45 minutos | [[05-Expiracao-Automatica]] |
| RF16 | O sistema deve fechar automaticamente um alerta `ACCEPTED` 30 minutos após o aceite, quando o agendamento tiver sido disparado (ver limitação em RNF08) | [[05-Expiracao-Automatica]] |
| RF17 | O sistema deve disponibilizar métricas de alertas agregadas por comunidade, por status, por categoria e por evento | [[08-Metricas]] |
| RF18 | O sistema deve permitir listar e consultar alertas por ID através de um read model desnormalizado, aplicando o filtro de visibilidade de saúde | [[09-Consulta-de-Alertas]] |

## 3. Requisitos Não Funcionais

| ID | Requisito | Categoria | Regra de origem |
|---|---|---|---|
| RNF01 | Jobs de expiração devem ser idempotentes: no máximo um job ativo por fila por alerta (`jobId = alertId`) | Confiabilidade | [[05-Expiracao-Automatica]] |
| RNF02 | Jobs de expiração que falharem definitivamente devem ser roteados para uma fila de dead-letter dedicada, retendo os últimos 50 para investigação | Confiabilidade | [[13-Observabilidade]] |
| RNF03 | Casos de uso, filas e eventos de domínio devem ser instrumentados com OpenTelemetry (`@ObserveBusiness`, `@ObserveQueue`, `@ObserveEvent`) | Observabilidade | [[13-Observabilidade]] |
| RNF04 | Escrita (`AlertRepository`) e leitura (`AlertDetailsRepository`) devem ser servidas por contratos distintos, sem acoplar o modelo de escrita às consultas | Manutenibilidade | [[09-Consulta-de-Alertas]], [[12-Contratos-de-Repositorio]] |
| RNF05 | O sistema nunca deve revelar, por meio de uma resposta de erro, a existência de um alerta de saúde para um usuário sem permissão de visualização | Segurança / Privacidade | [[04-Visibilidade-Alertas-Saude]] |
| RNF06 | Casos de uso e políticas de domínio devem ser testáveis isoladamente, sem dependência de infraestrutura real (repositórios em memória) | Testabilidade | Princípio geral, ver [[Geral]] §3 |
| RNF07 | Jobs de expiração concluídos com sucesso devem ser removidos imediatamente da fila (`removeOnComplete: true`), evitando acúmulo desnecessário no broker | Desempenho | [[13-Observabilidade]] |
| RNF08 | *(limitação conhecida, não uma meta)* — hoje o agendamento de expiração de `ACCEPTED` depende de `AlertCreatedEvent`, então alertas aceitos via reação comunitária não têm essa expiração agendada; RF16 só se cumpre no caminho "criado já aceito" | Confiabilidade | [[05-Expiracao-Automatica]], [[11-Eventos-de-Dominio]] |

## Ver também

- [[Alertas]] — índice do domínio
- [[10-Erros-de-Dominio]]
- [[13-Observabilidade]]
- [[13-Requisitos|Requisitos - Usuários]]
