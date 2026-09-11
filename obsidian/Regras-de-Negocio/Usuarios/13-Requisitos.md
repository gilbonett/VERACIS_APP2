---
title: Requisitos - Usuários
tags:
  - regra-de-negocio
  - usuarios
  - requisitos
  - requisitos-funcionais
  - requisitos-nao-funcionais
aliases:
  - Requisitos Funcionais e Não Funcionais - Usuários
  - User Requirements
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Requisitos

| | |
|---|---|
| **Domínio** | [[Usuarios]] |
| **Código-fonte** | `apps/api/src/domain/users/` |
| **Última atualização** | 2026-07-22 |

---

## 1. Sobre esta página

Requisitos extraídos das regras de negócio já documentadas neste domínio, reescritos em formato testável — apontam para a página de origem em vez de repetir a narrativa. Segue o mesmo padrão de [[15-Requisitos|Requisitos - Alertas]].

## 2. Requisitos Funcionais

| ID | Requisito | Regra de origem |
|---|---|---|
| RF01 | O sistema deve recusar o cadastro se já existir usuário com o mesmo CPF ou o mesmo e-mail | [[02-Registro-de-Usuario]] |
| RF02 | O sistema deve gerar hash da senha antes de persistir, nunca armazenando texto plano | [[02-Registro-de-Usuario]] |
| RF03 | O sistema deve marcar toda conta nova como `ACTIVED`, verificada (`isVerified = true`) e com OTP desativado | [[02-Registro-de-Usuario]], [[04-Autenticacao-em-Duas-Etapas]] |
| RF04 | O sistema deve vincular a conta às comunidades informadas no cadastro | [[02-Registro-de-Usuario]], [[05-Vinculo-com-Comunidades]] |
| RF05 | O sistema deve registrar o aceite dos termos de uso (IP, user agent, data) no momento do cadastro | [[02-Registro-de-Usuario]], [[06-Termos-de-Uso]] |
| RF06 | O sistema deve notificar os líderes das comunidades quando um novo `MEMBER` se cadastrar | [[05-Vinculo-com-Comunidades]] |
| RF07 | O sistema deve invalidar o cache de perfil antes de servir uma consulta de perfil | [[03-Perfil-e-Conta]] |
| RF08 | O sistema deve permitir atualizar nome, e-mail, telefone, e-mail de recuperação e avatar de forma parcial (somente os campos enviados) | [[03-Perfil-e-Conta]] |
| RF09 | O sistema deve impedir a atualização de perfil para um e-mail já pertencente a outra conta | [[03-Perfil-e-Conta]] |
| RF10 | O sistema deve exigir a senha atual correta para permitir a troca de senha | [[03-Perfil-e-Conta]] |
| RF11 | O sistema deve marcar o tutorial do mapa como concluído de forma idempotente, sem sobrescrever a data original de conclusão | [[03-Perfil-e-Conta]] |
| RF12 | O sistema deve permitir ativar OTP apenas se ainda não estiver ativado | [[04-Autenticacao-em-Duas-Etapas]] |
| RF13 | O sistema deve restringir consulta de usuário por ID e listagem de usuários aos papéis `MANAGER` e `ROOT` | [[07-Administracao-de-Usuarios]] |
| RF14 | O sistema deve permitir obter os IDs de todos os usuários vinculados a uma comunidade | [[05-Vinculo-com-Comunidades]] |

## 3. Requisitos Não Funcionais

| ID | Requisito | Categoria | Regra de origem |
|---|---|---|---|
| RNF01 | Senhas devem ser comparadas e armazenadas exclusivamente por hash (`HashGenerator`/`HashComparer`), nunca em texto plano | Segurança | [[02-Registro-de-Usuario]], [[03-Perfil-e-Conta]] |
| RNF02 | O aceite de termos deve preservar IP e user agent como trilha de auditoria de compliance | Auditoria / Compliance | [[06-Termos-de-Uso]] |
| RNF03 | Eventos de domínio consumidos por subscribers devem ser instrumentados com `@ObserveEvent` | Observabilidade | [[11-Observabilidade]] |
| RNF04 | Consultas de perfil devem priorizar consistência (invalidação de cache) sobre desempenho | Consistência | [[03-Perfil-e-Conta]] |
| RNF05 | *(limitação conhecida, não uma meta)* — nenhum caso de uso de negócio deste domínio tem `@ObserveBusiness`; RNF03 só cobre os subscribers de evento, não os fluxos de cadastro, senha ou OTP | Observabilidade | [[11-Observabilidade]] |
| RNF06 | *(limitação conhecida, não uma meta)* — os estados `DISABLED`/`BLOCKED` e o par ativar/desativar conta estão modelados (entidade + erros) mas não implementados; qualquer requisito de bloqueio de conta deve ser tratado como não atendido até um caso de uso existir | Confiabilidade / Segurança | [[01-Ciclo-de-Vida-da-Conta]], [[09-Erros-de-Dominio]] |

## Ver também

- [[Usuarios]] — índice do domínio
- [[09-Erros-de-Dominio]]
- [[11-Observabilidade]]
- [[15-Requisitos|Requisitos - Alertas]]
