---
title: Alertas
tags:
  - regra-de-negocio
  - dominio
  - alertas
  - indice
aliases:
  - Regras de Negócio - Alertas
  - Alerts Domain
  - Domínio de Alertas
status: Ativo
versao: "2.0"
classificacao: Uso Interno
---

# Alertas
### Domínio de Negócio — Índice Mestre

[[Geral]] › [[Regras-de-Negocio|Regras de Negócio]] › **Alertas**

| | |
|---|---|
| **Documento** | Regras de Negócio — Domínio de Alertas |
| **Versão** | 2.0 |
| **Status** | Ativo |
| **Classificação** | Uso Interno |
| **Última atualização** | 2026-07-22 |
| **Código-fonte** | `apps/api/src/domain/alerts/` |
| **Mantenedor** | Equipe VERACIS — Backend |

---

## 1. Sobre este documento

Esta é a página-índice do domínio de Alertas — o núcleo funcional do VERACIS. Um alerta é o registro criado por um usuário (autor) para relatar uma vulnerabilidade social, ambiental ou de saúde observada em um território, associado a uma comunidade, uma categoria, uma localização geográfica e, opcionalmente, uma descrição, eventos, riscos e anexos.

Cada regra de negócio vive em sua própria página, referenciada abaixo. Este formato segue o padrão institucional do vault: uma página de domínio nunca cresce indefinidamente — ela se divide em subpáginas quando ganha profundidade, mantendo cada assunto navegável, versionável e citável isoladamente via `[[wikilink]]`. Este é o modelo de referência para os demais domínios documentados, como [[Usuarios|Usuários]] (`UserRole` e `Membership` usados em várias regras deste domínio), em [[Geral|VERACIS]] (seção 9 — Estrutura da Documentação).

## 2. Mapa Mental

Visão geral navegável de todas as regras deste domínio. Clique nos nós do canvas para abrir a página correspondente.

![[Regras-de-Negocio/Alertas/Canvas/Alertas - Mapa Mental.canvas]]

## 3. Índice de Regras

| # | Página | Resumo |
|---|---|---|
| 01 | [[01-Ciclo-de-Vida\|Ciclo de Vida]] | Estados do alerta (`PENDING`, `ACCEPTED`, `REJECTED`, `CLOSED`) e transições válidas |
| 02 | [[02-Criacao-de-Alertas\|Criação de Alertas]] | Regras de criação, campos obrigatórios, aceite automático por papel |
| 03 | [[03-Confirmacao-Comunitaria\|Confirmação Comunitária]] | Reações (LIKE/DISLIKE), quórum de 5 likes, usuário coringa |
| 04 | [[04-Visibilidade-Alertas-Saude\|Visibilidade de Alertas de Saúde]] | Restrição de acesso a alertas da categoria saúde |
| 05 | [[05-Expiracao-Automatica\|Expiração Automática]] | TTLs de 45 min (pendente) e 30 min (aceito), filas BullMQ |
| 06 | [[06-Comentarios\|Comentários]] | Regras de criação de comentários em alertas |
| 07 | [[07-Anexos\|Anexos]] | Associação de arquivos (S3) a alertas |
| 08 | [[08-Metricas\|Métricas]] | Agregações por comunidade, status, categoria e evento |
| 09 | [[09-Consulta-de-Alertas\|Consulta de Alertas]] | Read model `AlertDetails`, listagem e busca por ID |
| 10 | [[10-Erros-de-Dominio\|Erros de Domínio]] | Catálogo de erros e condições de disparo |
| 11 | [[11-Eventos-de-Dominio\|Eventos de Domínio]] | Eventos emitidos e consumidos, incluindo eventos mortos |
| 12 | [[12-Contratos-de-Repositorio\|Contratos de Repositório]] | Interfaces de persistência do domínio |
| 13 | [[13-Observabilidade\|Observabilidade]] | Instrumentação com OpenTelemetry (decorators) |
| 14 | [[14-Glossario\|Glossário]] | Termos do domínio |
| 15 | [[15-Requisitos\|Requisitos]] | Requisitos funcionais e não funcionais, rastreados até cada regra |

## 4. Mapas Complementares

| Canvas | Conteúdo |
|---|---|
| [[Regras-de-Negocio/Alertas/Canvas/Alertas - Mapa Mental.canvas\|Mapa Mental]] | Visão geral de todas as regras do domínio |
| [[Regras-de-Negocio/Alertas/Canvas/Alertas - Maquina de Estados.canvas\|Máquina de Estados]] | Estados e transições do alerta, com TTLs de expiração |
| [[Regras-de-Negocio/Alertas/Canvas/Alertas - Modelo de Dominio.canvas\|Modelo de Domínio]] | Aggregate root, entidades, read model e repositórios |
| [[Regras-de-Negocio/Alertas/Canvas/Alertas - Fluxo de Confirmacao.canvas\|Fluxo de Confirmação]] | Árvore de decisão do aceite automático via reações |

## 5. Lacunas e Débitos Técnicos Conhecidos

> [!danger] Registrado aqui para rastreabilidade institucional — não são requisitos de negócio, são achados do código atual.

| Lacuna | Detalhe | Página |
|---|---|---|
| Status `REJECTED` sem fluxo de disparo | `Alert.doReject()` existe mas nenhum caso de uso o chama | [[01-Ciclo-de-Vida]] |
| `AlertAcceptedEvent` nunca emitido | Alertas aceitos via reação comunitária não agendam expiração de 30 min | [[05-Expiracao-Automatica]], [[11-Eventos-de-Dominio]] |
| Anexos sem validação de negócio | `CreateAlertAttachmentUseCase` não valida existência do alerta nem do anexo | [[07-Anexos]] |
| Métricas usam apenas a 1ª comunidade do usuário | Usuários multi-comunidade não têm métricas agregadas de todas | [[08-Metricas]] |

## 6. Como Manter Este Domínio

Ao alterar `apps/api/src/domain/alerts/`, siga o checklist de [[Geral|VERACIS]] (seção 13) e, adicionalmente: identifique qual subpágina é afetada e atualize-a isoladamente; se a mudança introduzir um novo estado, papel ou fluxo de decisão, atualize também o canvas correspondente; nunca deixe uma regra descrita apenas em código — toda regra de negócio nova deve ter uma linha nesta documentação antes do merge.
