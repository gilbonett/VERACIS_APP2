---
title: Requisitos - Comunidades
tags:
  - regra-de-negocio
  - comunidades
  - requisitos
  - requisitos-funcionais
  - requisitos-nao-funcionais
aliases:
  - Requisitos Funcionais e Não Funcionais - Comunidades
  - Community Requirements
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Requisitos

| | |
|---|---|
| **Domínio** | [[Comunidades]] |
| **Código-fonte** | `apps/api/src/domain/communities/` |
| **Última atualização** | 2026-07-22 |

---

## 1. Sobre esta página

Requisitos extraídos das regras de negócio deste domínio, em formato testável, rastreados até a página de origem. Mesmo padrão de [[15-Requisitos|Requisitos - Alertas]] e [[13-Requisitos|Requisitos - Usuários]].

## 2. Requisitos Funcionais

| ID | Requisito | Regra de origem |
|---|---|---|
| RF01 | O sistema deve listar todas as comunidades, ordenadas por nome, com filtro opcional por bioma | [[02-Consulta-de-Comunidades]] |
| RF02 | O sistema deve permitir a listagem de comunidades sem autenticação (acesso de visitante) | [[02-Consulta-de-Comunidades]] |
| RF03 | O sistema deve listar o catálogo completo de eventos para usuários autenticados | [[03-Eventos]] |
| RF04 | O sistema deve listar os eventos de uma categoria específica, retornando lista vazia para categoria inexistente | [[03-Eventos]] |
| RF05 | O sistema deve garantir slug único para comunidades, biomas e eventos | [[01-Modelo-e-Conceitos]] |
| RF06 | O sistema deve associar toda comunidade a exatamente um bioma e a um autor | [[01-Modelo-e-Conceitos]] |
| RF07 | O sistema deve popular comunidades, biomas, categorias e eventos por seed idempotente com IDs estáveis | [[04-Dados-de-Referencia-e-Seeds]] |

## 3. Requisitos Não Funcionais

| ID | Requisito | Categoria | Regra de origem |
|---|---|---|---|
| RNF01 | Os IDs dos dados de referência devem ser estáveis entre execuções do seed e idênticos entre ambientes — constantes de outros domínios dependem literalmente deles | Integridade / Confiabilidade | [[04-Dados-de-Referencia-e-Seeds]] |
| RNF02 | O seed deve ser idempotente (`upsert`), seguro para reexecução em qualquer ambiente, inclusive produção | Confiabilidade | [[04-Dados-de-Referencia-e-Seeds]] |
| RNF03 | A unicidade de slug deve ser garantida por constraint de banco (`@unique` + índice) | Integridade | [[01-Modelo-e-Conceitos]] |
| RNF04 | O endpoint público de comunidades não deve expor dados sensíveis — apenas cadastro de referência (nome, slug, localização, bioma) | Segurança | [[02-Consulta-de-Comunidades]] |
| RNF05 | *(limitação conhecida, não uma meta)* — não existe caso de uso de escrita; qualquer requisito de "criar/editar comunidade em runtime" está não atendido até que um caso de uso seja implementado | Manutenibilidade | [[01-Modelo-e-Conceitos]], [[Comunidades]] §5 |
| RNF06 | *(limitação conhecida, não uma meta)* — nenhuma instrumentação `@ObserveBusiness` no domínio; cobertura atual vem só dos traces automáticos de infraestrutura | Observabilidade | [[07-Observabilidade]] |

## Ver também

- [[Comunidades]] — índice do domínio
- [[05-Erros-de-Dominio]]
- [[15-Requisitos|Requisitos - Alertas]]
- [[13-Requisitos|Requisitos - Usuários]]
