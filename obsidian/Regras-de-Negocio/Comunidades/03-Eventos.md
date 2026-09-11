---
title: Eventos (Catálogo)
tags:
  - regra-de-negocio
  - comunidades
  - eventos
  - catalogo
aliases:
  - Event Catalog
  - Catálogo de Eventos
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Eventos (Catálogo)

| | |
|---|---|
| **Domínio** | [[Comunidades]] |
| **Casos de uso** | `GetEventsUseCase`, `GetEventsByCategoryIdUseCase` |
| **Código-fonte** | `apps/api/src/domain/communities/entities/event.ts`, `use-cases/get-events.ts`, `use-cases/get-events-by-category-id.ts` |
| **Última atualização** | 2026-07-22 |

---

## 1. O Que é um Evento

`Event` é um item de **catálogo**: um tipo de ocorrência nomeado que o usuário seleciona ao criar um alerta (ex.: "Febre" na categoria Saúde, "Enchente" na categoria Climático). Atributos: `name`, `slug` (único), `description`, `icon` e `categoryId`.

> [!warning] Nome ambíguo — não confundir com evento de domínio
> No VERACIS, "Event" tem dois sentidos: (1) esta entidade de catálogo; (2) eventos de domínio do padrão DDD (`AlertCreatedEvent`, `UserRegistered`...). As páginas de [[11-Eventos-de-Dominio|Eventos de Domínio - Alertas]] e [[08-Eventos-de-Dominio|Eventos de Domínio - Usuários]] tratam do segundo sentido; esta página trata do primeiro.

## 2. Localização Conceitual Ambígua

`Event` mora em `domain/communities/entities/`, mas:

- Não referencia `Community` em nenhum campo — sua única relação é com `categoryId` (domínio de Categorias).
- Seu principal consumidor é o domínio de **Alertas**: `Alert.doAssociateEvents()` cria `AlertEvent` ligando alerta a eventos do catálogo, e a política de visibilidade de saúde ([[04-Visibilidade-Alertas-Saude]]) decide com base na categoria dos eventos do alerta.

Numa futura reorganização, `Event` caberia melhor no domínio de Categorias (ou num domínio próprio de catálogo). Registrado em [[Comunidades]] §5 como débito.

## 3. Consultas

| Caso de uso | Comportamento |
|---|---|
| `GetEventsUseCase` | Retorna todos os eventos do catálogo (`findAll`), sem filtro, sem paginação, retorno cru (`Event[]`, sem `Either`) |
| `GetEventsByCategoryIdUseCase` | Retorna eventos de uma categoria (`findManyByCategoryId`), envelope `Either<never, ...>` — sem validação de existência da categoria: ID inexistente retorna lista vazia, não erro |

Ambos os endpoints exigem autenticação (não são `@Public()`), diferente da listagem de comunidades ([[02-Consulta-de-Comunidades]]).

## 4. Papel no Fluxo de Criação de Alertas

O frontend consome este catálogo para montar o formulário de criação de alerta: o usuário escolhe categoria → eventos daquela categoria → os `eventIds` selecionados seguem no payload de [[02-Criacao-de-Alertas|criação do alerta]]. A associação persiste via `AlertEventsRepository` (domínio de Alertas), não por este domínio.

## Ver também

- [[Comunidades]] — índice do domínio
- [[01-Modelo-e-Conceitos]]
- [[04-Dados-de-Referencia-e-Seeds]] — de onde vêm os eventos
- [[02-Criacao-de-Alertas]] — consumo dos `eventIds`
- [[04-Visibilidade-Alertas-Saude]] — decisão baseada na categoria do evento
