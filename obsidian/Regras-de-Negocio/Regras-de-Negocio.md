---
title: Regras de Negócio
tags:
  - regra-de-negocio
  - indice
aliases:
  - Regras de Negócio - Índice Mestre
  - Business Rules Index
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Regras de Negócio
### Índice Mestre de Domínios

| | |
|---|---|
| **Documento** | Índice Mestre — Regras de Negócio do VERACIS |
| **Versão** | 1.0 |
| **Status** | Ativo |
| **Classificação** | Uso Interno |
| **Última atualização** | 2026-07-22 |
| **Código-fonte** | `apps/api/src/domain/` |

---

## 1. Sobre este documento

Esta é a porta de entrada para toda a documentação de regras de negócio do VERACIS, referenciada em [[Geral|VERACIS]] (seção 9 — Estrutura da Documentação). Cada domínio de negócio ganha sua própria pasta, com um índice (`<Domínio>.md`), páginas numeradas por regra e um conjunto de mapas mentais (`.canvas`). O padrão está fixado em [[Alertas|Alertas]] e replicado em [[Usuarios|Usuários]] — qualquer domínio novo segue a mesma estrutura.

## 2. Domínios Documentados

| Domínio | Código-fonte | Status | Resumo |
|---|---|---|---|
| [[Alertas\|Alertas]] | `apps/api/src/domain/alerts/` | ✅ Documentado | Núcleo funcional — registro, confirmação comunitária, visibilidade e expiração de alertas |
| [[Usuarios\|Usuários]] | `apps/api/src/domain/users/` | ✅ Documentado | Conta, perfil, OTP, vínculo com comunidades e aceite de termos |
| [[Comunidades\|Comunidades]] | `apps/api/src/domain/communities/` | ✅ Documentado | Território e catálogo — domínio de dados de referência, somente-leitura, populado por seeds |

## 3. Domínios Pendentes

Levantado a partir de `apps/api/src/domain/` — pastas com regras de negócio próprias, ainda sem documentação neste vault. Ordem sugerida por acoplamento com os domínios já documentados (mais citado primeiro):

| Domínio (pasta) | Por que priorizar |
|---|---|
| `categories` | `categoryId` é central em [[Alertas\|Alertas]] (inclusive na regra de visibilidade de saúde) e em `Event` de [[Comunidades\|Comunidades]] |
| `notifications` | Consome eventos de ambos os domínios documentados (`UserCreatedEvent`, e potencialmente eventos de alertas) |
| `auth` | Login, sessão e possivelmente a aplicação real dos status `DISABLED`/`BLOCKED` de [[Usuarios\|Usuários]] — ver a lacuna registrada lá |
| `risks` | `riskId` usado em [[Alertas\|Alertas]] (associação opcional de riscos) |
| `attachments` | Upload/armazenamento consumido por `AlertAttachment` — ver [[07-Anexos]] |

`cryptography`, `queue`, `storage`, `common` e `value-objects` são módulos de suporte técnico, não domínios de negócio — não entram nesta lista.

## 4. Convenção Fixada

Ao documentar um novo domínio, siga exatamente a estrutura de [[Alertas|Alertas]] / [[Usuarios|Usuários]]:

1. Pasta própria em `Regras-de-Negocio/<Dominio>/`, com `<Dominio>.md` como índice (nome do arquivo igual ao nome da pasta).
2. Páginas numeradas (`01-`, `02-`, ...) por regra/fluxo, cada uma citável isoladamente.
3. Última página numerada sempre `Erros-de-Dominio`, seguida de `Contratos-de-Repositorio`, `Observabilidade`, `Glossario` e `Requisitos` — nessa ordem, para manter os índices comparáveis entre domínios.
4. Subpasta `Canvas/` com no mínimo: Mapa Mental (hub de todas as páginas), Máquina de Estados (se o domínio tiver um ciclo de vida com status), Modelo de Domínio (aggregate + entidades + repositórios) e um mapa de fluxo/decisão para a regra mais complexa do domínio.
5. Seção "Lacunas e Débitos Técnicos Conhecidos" no índice — toda entidade, evento, erro ou branch encontrado no código sem caso de uso que o alcance deve ser registrado ali, não silenciado.
6. Atualize esta página (seção 2 e 3) ao concluir ou iniciar um novo domínio.

## Ver também

- [[Geral]] — visão geral do projeto
- [[Alertas]]
- [[Usuarios]]
