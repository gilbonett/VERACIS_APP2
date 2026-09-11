---
title: Glossário - Comunidades
tags:
  - regra-de-negocio
  - comunidades
  - glossario
aliases:
  - Community Glossary
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Glossário do Domínio

| | |
|---|---|
| **Domínio** | [[Comunidades]] |
| **Última atualização** | 2026-07-22 |

---

| Termo | Descrição | Ver |
|---|---|---|
| Comunidade | Unidade territorial e social do VERACIS — onde alertas são registrados e usuários se vinculam | [[01-Modelo-e-Conceitos]] |
| Bioma | Classificação ecológica que agrupa comunidades (Amazônia, Cerrado, Caatinga nos seeds); entidade mora em `domain/common` | [[01-Modelo-e-Conceitos]] |
| Evento (catálogo) | Tipo de ocorrência selecionável na criação de alertas (ex.: "Febre", "Enchente") — não confundir com evento de domínio DDD | [[03-Eventos]] |
| Slug | Identificador legível e único gerado por normalização de texto, compartilhado por comunidade, bioma e evento | [[01-Modelo-e-Conceitos]] |
| Dado de referência | Registro que nasce de seed versionado, não de fluxo de usuário — todo o conteúdo deste domínio | [[04-Dados-de-Referencia-e-Seeds]] |
| Seed idempotente | Script de população que usa `upsert` com IDs fixos, seguro para rodar repetidamente | [[04-Dados-de-Referencia-e-Seeds]] |
| Domínio somente-leitura | Domínio sem casos de uso de escrita — mutação só via seed/migração | [[Comunidades]] §1 |
| Visitante | Usuário não autenticado; pode listar comunidades pelo endpoint público | [[02-Consulta-de-Comunidades]] |

## Ver também

- [[Comunidades]] — índice do domínio
- [[Geral]] — glossário geral do projeto
