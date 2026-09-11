---
title: Glossário - Alertas
tags:
  - regra-de-negocio
  - alertas
  - glossario
aliases:
  - Alert Glossary
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Glossário do Domínio

| | |
|---|---|
| **Domínio** | [[Alertas]] |
| **Última atualização** | 2026-07-22 |

---

| Termo | Descrição | Ver |
|---|---|---|
| Alerta | Registro de vulnerabilidade criado por um usuário, associado a comunidade, categoria, localização e eventos | [[Alertas]] |
| `PENDING` | Alerta aguardando confirmação comunitária | [[01-Ciclo-de-Vida]] |
| `ACCEPTED` | Alerta confirmado pela comunidade ou criado diretamente por papel não-membro | [[01-Ciclo-de-Vida]] |
| `REJECTED` | Status existente na entidade, sem fluxo de negócio que o dispare atualmente | [[01-Ciclo-de-Vida]] |
| `CLOSED` | Alerta encerrado, manualmente ou por expiração automática | [[01-Ciclo-de-Vida]] |
| Alerta de saúde | Alerta com pelo menos um evento associado à categoria fixa de saúde, sujeito a visibilidade restrita | [[04-Visibilidade-Alertas-Saude]] |
| Quórum de confirmação | Regra de 5 reações `LIKE` necessárias para aceitar automaticamente um alerta criado por `MEMBER` | [[03-Confirmacao-Comunitaria]] |
| Usuário coringa | Conta cuja reação `LIKE` única confirma qualquer alerta, usada em demonstrações | [[03-Confirmacao-Comunitaria]] |
| TTL de expiração | Tempo até um alerta `PENDING` (45 min) ou `ACCEPTED` (30 min) ser fechado automaticamente | [[05-Expiracao-Automatica]] |
| Read model | Representação desnormalizada (`AlertDetails`) usada exclusivamente para consultas | [[09-Consulta-de-Alertas]] |
| Aggregate root | `Alert` — entidade raiz que garante consistência de eventos, riscos e anexos associados | [[Alertas]] |
| DLQ | Dead-Letter Queue — fila para onde vão jobs de expiração que falharam definitivamente | [[13-Observabilidade]] |

## Ver também

- [[Alertas]] — índice do domínio
- [[Geral]] — glossário geral do projeto
