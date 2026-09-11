---
title: Glossário - Usuários
tags:
  - regra-de-negocio
  - usuarios
  - glossario
aliases:
  - User Glossary
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Glossário do Domínio

| | |
|---|---|
| **Domínio** | [[Usuarios]] |
| **Última atualização** | 2026-07-22 |

---

| Termo | Descrição | Ver |
|---|---|---|
| Usuário | Aggregate root que representa uma conta — perfil, credenciais, papel e vínculos com comunidades | [[Usuarios]] |
| `ACTIVED` | Status atribuído a toda conta no cadastro; único status efetivamente em uso hoje | [[01-Ciclo-de-Vida-da-Conta]] |
| `DISABLED` / `BLOCKED` | Status modelados na entidade, sem fluxo de negócio que os dispare atualmente | [[01-Ciclo-de-Vida-da-Conta]] |
| `UserRole` | `MEMBER`, `LEADER`, `MANAGER` ou `ROOT` — reutilizado em outros domínios (ex.: [[Alertas\|Alertas]]) | [[02-Registro-de-Usuario]] |
| OTP | Autenticação em duas etapas (one-time password); toda conta nasce com OTP desativado | [[04-Autenticacao-em-Duas-Etapas]] |
| Membership | Vínculo entre um usuário e uma comunidade | [[05-Vinculo-com-Comunidades]] |
| Terms | Documento de termos de uso com workflow editorial `DRAFT → PUBLISHED → ARCHIVED`, sem gestão implementada | [[06-Termos-de-Uso]] |
| UserTerms | Registro de aceite de um termo por um usuário, com IP e user agent | [[06-Termos-de-Uso]] |
| Evento morto | Evento de domínio definido (ou apenas referenciado) mas nunca emitido em tempo de execução | [[08-Eventos-de-Dominio]] |

## Ver também

- [[Usuarios]] — índice do domínio
- [[Geral|Geral]] — glossário geral do projeto
