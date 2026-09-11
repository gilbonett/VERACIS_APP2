---
title: Usuários
tags:
  - regra-de-negocio
  - dominio
  - usuarios
  - indice
aliases:
  - Regras de Negócio - Usuários
  - Users Domain
  - Domínio de Usuários
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Usuários
### Domínio de Negócio — Índice Mestre

[[Geral]] › [[Regras-de-Negocio|Regras de Negócio]] › **Usuários**

| | |
|---|---|
| **Documento** | Regras de Negócio — Domínio de Usuários |
| **Versão** | 1.0 |
| **Status** | Ativo |
| **Classificação** | Uso Interno |
| **Última atualização** | 2026-07-22 |
| **Código-fonte** | `apps/api/src/domain/users/` |
| **Mantenedor** | Equipe VERACIS — Backend |

---

## 1. Sobre este documento

Este é o índice do domínio de Usuários — responsável pela conta do usuário (cadastro, perfil, senha, autenticação em duas etapas), pelo vínculo entre usuário e comunidade (`Membership`) e pelo aceite de termos de uso. É o domínio consumido por praticamente todos os outros (ex.: [[Alertas|Alertas]] usa `UserRole` e `communities` em várias regras).

Segue o mesmo padrão hub-and-spoke estabelecido em [[Alertas|Alertas]]: cada regra vive em sua própria página, citável isoladamente via `[[wikilink]]`, mantendo o domínio navegável mesmo conforme ganha profundidade.

## 2. Mapa Mental

![[Regras-de-Negocio/Usuarios/Canvas/Usuarios - Mapa Mental.canvas]]

## 3. Índice de Regras

| # | Página | Resumo |
|---|---|---|
| 01 | [[01-Ciclo-de-Vida-da-Conta\|Ciclo de Vida da Conta]] | Status da conta (`ACTIVED`, `DISABLED`, `BLOCKED`) e o que está realmente implementado |
| 02 | [[02-Registro-de-Usuario\|Registro de Usuário]] | Cadastro, unicidade de CPF/e-mail, papéis, eventos disparados |
| 03 | [[03-Perfil-e-Conta\|Perfil e Conta]] | Atualização de perfil, troca de senha, cache de perfil, tutorial do mapa |
| 04 | [[04-Autenticacao-em-Duas-Etapas\|Autenticação em Duas Etapas (OTP)]] | Ativação de OTP e a lacuna de desativação |
| 05 | [[05-Vinculo-com-Comunidades\|Vínculo com Comunidades]] | `Membership`, papéis por comunidade, notificação a líderes |
| 06 | [[06-Termos-de-Uso\|Termos de Uso]] | Aceite de termos no cadastro e a lacuna de gestão do próprio termo |
| 07 | [[07-Administracao-de-Usuarios\|Administração de Usuários]] | Listagem e busca de usuários restritas a `MANAGER`/`ROOT` |
| 08 | [[08-Eventos-de-Dominio\|Eventos de Domínio]] | Eventos emitidos, condicionais e mortos; consumidores dentro e fora do domínio |
| 09 | [[09-Erros-de-Dominio\|Erros de Domínio]] | Catálogo de erros, incluindo os nunca lançados |
| 10 | [[10-Contratos-de-Repositorio\|Contratos de Repositório]] | Interfaces de persistência do domínio |
| 11 | [[11-Observabilidade\|Observabilidade]] | Cobertura real de instrumentação OpenTelemetry |
| 12 | [[12-Glossario\|Glossário]] | Termos do domínio |
| 13 | [[13-Requisitos\|Requisitos]] | Requisitos funcionais e não funcionais, rastreados até cada regra |

## 4. Mapas Complementares

| Canvas | Conteúdo |
|---|---|
| [[Regras-de-Negocio/Usuarios/Canvas/Usuarios - Mapa Mental.canvas\|Mapa Mental]] | Visão geral de todas as regras do domínio |
| [[Regras-de-Negocio/Usuarios/Canvas/Usuarios - Maquina de Estados.canvas\|Máquina de Estados da Conta]] | Estados `ACTIVED`/`DISABLED`/`BLOCKED` e por que quase nada transiciona hoje |
| [[Regras-de-Negocio/Usuarios/Canvas/Usuarios - Modelo de Dominio.canvas\|Modelo de Domínio]] | Aggregate `User`, `Membership`, `Terms`, `UserTerms` e repositórios |
| [[Regras-de-Negocio/Usuarios/Canvas/Usuarios - Fluxo de Registro.canvas\|Fluxo de Registro]] | Cadeia de eventos e efeitos colaterais disparados por `RegisterUserUseCase` |

## 5. Lacunas e Débitos Técnicos Conhecidos

> [!danger] Registrado aqui para rastreabilidade institucional — não são requisitos de negócio, são achados do código atual.

| Lacuna | Detalhe | Página |
|---|---|---|
| Status `DISABLED`/`BLOCKED` sem fluxo de disparo | `User.disable()`, `.activate()`, `.markEmailVerified()`, `.recordSignIn()` existem, mas nenhum caso de uso os chama | [[01-Ciclo-de-Vida-da-Conta]] |
| 3 erros de domínio nunca lançados | `AccountAlreadyActiveError`, `AccountAlreadyDisabledError`, `OtpAlreadyDisabledError` não têm caso de uso correspondente | [[09-Erros-de-Dominio]] |
| Não existe caso de uso para desativar OTP | `EnableOtpUseCase` existe, `DisableOtpUseCase` não | [[04-Autenticacao-em-Duas-Etapas]] |
| `UserMfaStateChanged` nunca emitido | Disparo comentado dentro de `EnableOtpUseCase` | [[08-Eventos-de-Dominio]] |
| `Terms` sem gestão própria | Existe entidade e workflow `DRAFT → PUBLISHED → ARCHIVED`, mas nenhum repositório ou caso de uso cria/publica um termo — apenas o aceite (`UserTerms`) é persistido | [[06-Termos-de-Uso]] |
| Métodos de handler com nome trocado | `OnUserRegistered` e `OnUserTermsAccepted` têm um método interno chamado `sendPasswordResetEmail` que não envia e-mail de redefinição de senha — o primeiro dispara e-mail de boas-vindas, o segundo apenas persiste o aceite do termo | [[08-Eventos-de-Dominio]] |
| Nenhum caso de uso instrumentado com `@ObserveBusiness` | Diferente de [[Alertas\|Alertas]], nenhum caso de uso deste domínio tem observabilidade de negócio aplicada | [[11-Observabilidade]] |

## 6. Como Manter Este Domínio

Ao alterar `apps/api/src/domain/users/`, siga o checklist de [[Geral|VERACIS]] (seção 13) e, adicionalmente: identifique a subpágina afetada e atualize-a isoladamente; se a mudança introduzir um novo estado, papel ou evento, atualize o canvas correspondente; ao fechar uma das lacunas listadas acima (por exemplo, implementar `DisableOtpUseCase`), mova o item da seção 5 para a página correspondente como regra ativa, não apenas apague a linha.
