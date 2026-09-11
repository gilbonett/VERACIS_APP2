---
title: Comunidades
tags:
  - regra-de-negocio
  - dominio
  - comunidades
  - indice
aliases:
  - Regras de Negócio - Comunidades
  - Communities Domain
  - Domínio de Comunidades
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Comunidades
### Domínio de Negócio — Índice Mestre

[[Geral]] › [[Regras-de-Negocio|Regras de Negócio]] › **Comunidades**

| | |
|---|---|
| **Documento** | Regras de Negócio — Domínio de Comunidades |
| **Versão** | 1.0 |
| **Status** | Ativo |
| **Classificação** | Uso Interno |
| **Última atualização** | 2026-07-22 |
| **Código-fonte** | `apps/api/src/domain/communities/` |
| **Mantenedor** | Equipe VERACIS — Backend |

---

## 1. Sobre este documento

Este é o índice do domínio de Comunidades — o **território** do VERACIS. Uma comunidade é a unidade geográfica e social onde tudo acontece: alertas pertencem a comunidades, usuários se vinculam a comunidades, notificações circulam dentro delas. Cada comunidade pertence a um bioma (Amazônia, Cerrado, Caatinga) e tem localização geográfica própria.

Apesar de ser o conceito mais referenciado de todo o sistema, o código deste domínio é o menor dos três documentados até agora — e essa assimetria é a informação mais importante desta documentação: **Comunidades é um domínio de dados de referência, essencialmente somente-leitura**, cujo conteúdo nasce de seeds versionados, não de fluxos de usuário. Entender isso evita procurar aqui regras que não existem (criação de comunidade, gestão de eventos) e explica por que os outros domínios confiam em IDs fixos deste.

Segue o padrão hub-and-spoke fixado em [[Regras-de-Negocio|Regras de Negócio]] (seção 4), com duas adições exclusivas deste domínio: a página de [[04-Dados-de-Referencia-e-Seeds|Dados de Referência e Seeds]] e o canvas de Mapa de Contexto cross-domain.

## 2. Mapa Mental

![[Regras-de-Negocio/Comunidades/Canvas/Comunidades - Mapa Mental.canvas]]

## 3. Índice de Regras

| # | Página | Resumo |
|---|---|---|
| 01 | [[01-Modelo-e-Conceitos\|Modelo e Conceitos]] | `Community`, `Biome`, `Event`, o value object `Slug` e onde cada um mora |
| 02 | [[02-Consulta-de-Comunidades\|Consulta de Comunidades]] | Listagem pública (visitante), filtro por bioma |
| 03 | [[03-Eventos\|Eventos]] | Catálogo de eventos por categoria, consumido pelo fluxo de criação de alertas |
| 04 | [[04-Dados-de-Referencia-e-Seeds\|Dados de Referência e Seeds]] | IDs fixos, seeds idempotentes e as constantes que outros domínios assumem |
| 05 | [[05-Erros-de-Dominio\|Erros de Domínio]] | Nenhum erro em uso — e um arquivo morto a remover |
| 06 | [[06-Contratos-de-Repositorio\|Contratos de Repositório]] | Interfaces de persistência do domínio |
| 07 | [[07-Observabilidade\|Observabilidade]] | Cobertura zero — lacuna registrada |
| 08 | [[08-Glossario\|Glossário]] | Termos do domínio |
| 09 | [[09-Requisitos\|Requisitos]] | Requisitos funcionais e não funcionais, rastreados até cada regra |

## 4. Mapas Complementares

| Canvas | Conteúdo |
|---|---|
| [[Regras-de-Negocio/Comunidades/Canvas/Comunidades - Mapa Mental.canvas\|Mapa Mental]] | Visão geral de todas as regras do domínio |
| [[Regras-de-Negocio/Comunidades/Canvas/Comunidades - Modelo de Dominio.canvas\|Modelo de Domínio]] | `Community`, `Biome`, `Event` e seus repositórios |
| [[Regras-de-Negocio/Comunidades/Canvas/Comunidades - Mapa de Contexto.canvas\|Mapa de Contexto]] | **(exclusivo)** Como Alertas, Usuários e Notificações consomem este domínio |
| [[Regras-de-Negocio/Comunidades/Canvas/Comunidades - Dados de Referencia.canvas\|Dados de Referência]] | **(exclusivo)** Esquema de IDs fixos dos seeds e quem depende de cada um |

Não há canvas de máquina de estados: nenhuma entidade deste domínio possui ciclo de vida com status — deliberadamente omitido em vez de inventar um diagrama vazio.

## 5. Lacunas e Débitos Técnicos Conhecidos

> [!danger] Registrado aqui para rastreabilidade institucional — não são requisitos de negócio, são achados do código atual.

| Lacuna | Detalhe | Página |
|---|---|---|
| Nenhum caso de uso de escrita | `Community.toCreate()` e `Event.create()` existem, mas só são chamados por mappers do Prisma (reconstituição) e pelo aggregate de Alertas — criar/editar comunidade ou evento só é possível via seed | [[01-Modelo-e-Conceitos]], [[04-Dados-de-Referencia-e-Seeds]] |
| `AlertNotFoundError` duplicado e morto | `communities/use-cases/errors/alert-not-found-error.ts` é cópia idêntica do erro do domínio de Alertas, sem nenhum importador — candidato a remoção | [[05-Erros-de-Dominio]] |
| `Biome` fora do domínio | Entidade, repositório e `CreateBiomeUseCase` moram em `domain/common`, não aqui — divisão que dificulta encontrar a regra | [[01-Modelo-e-Conceitos]] |
| `Event` conceitualmente ambíguo | Vive em Comunidades, mas referencia `categoryId` (domínio de Categorias) e é consumido por Alertas — não tem relação estrutural com `Community` | [[03-Eventos]] |
| Zero instrumentação | Nenhum decorator `@ObserveBusiness`/`@ObserveEvent` no domínio inteiro | [[07-Observabilidade]] |
| Casos de uso sem padrão `Either` | `GetCommunitiesUseCase` e `GetEventsUseCase` retornam valores crus, divergindo do padrão `Either<Error, T>` do restante do projeto | [[02-Consulta-de-Comunidades]], [[03-Eventos]] |
| Typos em código de infraestrutura | `GetCommuntiesController` (falta "i"), variável `resuls` — cosmético, mas dificulta busca por símbolo | [[02-Consulta-de-Comunidades]] |

## 6. Como Manter Este Domínio

Ao alterar `apps/api/src/domain/communities/` ou os seeds relacionados, siga o checklist de [[Geral|VERACIS]] (seção 13) e, adicionalmente: **nunca altere um ID fixo de seed sem varrer os consumidores listados em [[04-Dados-de-Referencia-e-Seeds]]** — constantes de outros domínios (como a política de visibilidade de alertas de saúde) dependem literalmente desses valores; se introduzir o primeiro caso de uso de escrita (criar comunidade), este domínio deixa de ser somente-leitura e as páginas 01, 02 e o índice precisam ser revisados; atualize [[Regras-de-Negocio|o índice mestre]] se o escopo do domínio mudar.
