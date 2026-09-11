---
title: Erros de Domínio - Comunidades
tags:
  - regra-de-negocio
  - comunidades
  - erros
aliases:
  - Community Domain Errors
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Erros de Domínio

| | |
|---|---|
| **Domínio** | [[Comunidades]] |
| **Código-fonte** | `apps/api/src/domain/communities/use-cases/errors/` |
| **Última atualização** | 2026-07-22 |

---

## 1. Catálogo

**Nenhum erro de domínio em uso.** Os três casos de uso são consultas sem pré-condição: lista vazia é resposta válida, filtro por ID inexistente retorna vazio — não há caminho de falha de negócio.

## 2. Arquivo Morto

> [!warning] `alert-not-found-error.ts` — cópia sem importador
> `communities/use-cases/errors/alert-not-found-error.ts` é uma cópia idêntica do `AlertNotFoundError` do domínio de Alertas ([[10-Erros-de-Dominio|catálogo de Alertas]]). Nenhum arquivo do projeto o importa — busca por `communities/use-cases/errors` não retorna nenhum consumidor. Artefato de copy-paste; candidato a remoção na próxima passagem pelo domínio. Até lá, cuidado ao buscar `AlertNotFoundError` por símbolo: existem duas classes com esse nome no projeto.

## 3. Erros Relacionados em Outros Domínios

Quem valida existência de comunidade não é este domínio: o cadastro de usuário ([[02-Registro-de-Usuario]]) e a criação de alerta ([[02-Criacao-de-Alertas]]) recebem `communityId` e confiam na integridade referencial do banco — nenhum dos dois retorna um erro de negócio "comunidade não encontrada" hoje. Se essa validação se tornar necessária, o erro pertence a este domínio.

## Ver também

- [[Comunidades]] — índice do domínio
- [[02-Consulta-de-Comunidades]]
- [[03-Eventos]]
