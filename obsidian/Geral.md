---
title: VERACIS
tags:
  - projeto
  - overview
aliases:
  - Visão Geral
  - VERACIS Overview
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# VERACIS
### Documento Oficial de Conhecimento do Projeto

| | |
|---|---|
| **Documento** | Visão Geral e Base de Conhecimento |
| **Versão** | 1.0 |
| **Status** | Ativo |
| **Classificação** | Uso Interno |
| **Última atualização** | 2026-07-22 |

---

## 1. Introdução

O VERACIS é uma plataforma dedicada ao registro, consulta, monitoramento e análise de alertas territoriais relacionados a vulnerabilidades sociais, ambientais e de saúde. Seu propósito é apoiar a identificação e o acompanhamento de situações de risco em determinados territórios, oferecendo uma base confiável de informação para tomada de decisão.

Este documento constitui a fonte oficial de conhecimento do projeto, reunindo em um único lugar as informações necessárias para orientar equipes de desenvolvimento, arquitetura, análise de negócio, gestão de produto e demais partes interessadas.

## 2. Propósito da Documentação

Esta base de conhecimento existe para centralizar o conhecimento institucional do projeto, documentar as regras de negócio vigentes e registrar as principais decisões arquiteturais tomadas ao longo do desenvolvimento. Ela também serve para padronizar as práticas adotadas pelas equipes, apoiar o onboarding de novos colaboradores e preservar o conhecimento técnico construído, evitando que informações relevantes se percam com a rotatividade de pessoas ou o passar do tempo. Além disso, funciona como referência para agentes de inteligência artificial que venham a atuar sobre o projeto.

## 3. Arquitetura

O VERACIS segue os princípios de Domain Driven Design, Clean Architecture, SOLID e é organizado como um monolito modular. Isso significa que as regras de negócio pertencem exclusivamente ao domínio da aplicação, sem depender de frameworks ou detalhes de infraestrutura. Os casos de uso não acessam o banco de dados diretamente, mas sim contratos definidos pelo próprio domínio, que são implementados pela camada de infraestrutura. As dependências apontam sempre para dentro, do externo para o núcleo de negócio, e todo o código é construído para ser testável de forma isolada.

Como regra obrigatória, nenhum caso de uso pode acessar o Prisma diretamente, nem os controllers podem conter lógica de negócio. O domínio nunca deve ficar acoplado à infraestrutura. Todo caso de uso precisa ser testável, todo código novo precisa considerar observabilidade, e toda funcionalidade relevante deve ser documentada.

## 4. Stack Tecnológica

| Camada | Tecnologias |
|---|---|
| Frontend | Next.js, React, TypeScript, React Query, SSE |
| Backend | NestJS, TypeScript, Prisma ORM |
| Banco de Dados | PostgreSQL |
| Cache | Redis |
| Filas | BullMQ |
| Armazenamento | AWS S3 |
| Observabilidade | OpenTelemetry, Grafana, Mimir, Loki, Tempo, Pyroscope |

## 5. Infraestrutura

A infraestrutura do projeto é hospedada na AWS, utilizando ECS e ECR para orquestração e distribuição de containers, RDS PostgreSQL como banco de dados relacional e ElastiCache Redis para cache. O armazenamento de arquivos é feito via S3, segredos e credenciais são geridos pelo Secrets Manager, e o monitoramento de infraestrutura é feito através do CloudWatch. O controle de acesso segue as políticas definidas via IAM.

## 6. Integrações Externas

As integrações externas do projeto ainda estão em processo de mapeamento e serão detalhadas nesta seção conforme forem definidas.

## 7. Repositórios

O projeto está dividido em repositórios de backend, frontend e infraestrutura. As descrições de cada um serão adicionadas conforme a documentação avançar.

## 8. CI/CD

O fluxo de entrega segue um processo padrão: cada commit passa por pull request, revisão de código, build, execução de testes e, por fim, deploy. Como regra, nenhum código é integrado sem revisão e sem testes, e não é permitido realizar deploy manual em produção.

## 9. Estrutura da Documentação

A documentação do projeto está organizada em onze frentes principais: informações gerais do projeto, regras de negócio, arquitetura, backend, frontend, infraestrutura, observabilidade, decisões técnicas, padrões de desenvolvimento, contexto para IA e roadmap, além do registro histórico de ADRs (Architecture Decision Records).

As regras de negócio estão documentadas em [[Regras-de-Negocio|Regras de Negócio]], organizadas por domínio (um domínio de `apps/api/src/domain/` por pasta, com índice, páginas numeradas e mapas mentais próprios). A performance do banco de dados (queries, índices, N+1, paginação) está documentada em [[Banco-de-Dados]]. A plataforma de identidade (autenticação, sessões, MFA, auditoria, Identity Providers, roadmap GOV.BR/SCPA) está documentada em [[Autenticacao/README|Autenticação]]. A plataforma de autorização (RBAC, permissões, policies, ownership, escopos) está documentada em [[Autorizacao/README|Autorização]].

## 10. Como Utilizar Este Documento

Ao iniciar qualquer atividade dentro do projeto, recomenda-se consultar primeiro as regras de negócio e a arquitetura vigente, seguidas dos padrões de desenvolvimento adotados. Também é importante verificar se já existem decisões técnicas registradas sobre o tema e avaliar possíveis impactos na observabilidade da aplicação. Ao final de qualquer mudança relevante, a documentação deve ser atualizada.

## 11. Contexto para Agentes de IA

Qualquer agente de inteligência artificial que atue sobre o projeto deve, antes de gerar código, ler esta página, consultar as regras de negócio relevantes e a arquitetura vigente, seguir os padrões já documentados, respeitar os princípios de DDD e Clean Architecture, e priorizar consistência com o que já existe em vez de buscar velocidade a qualquer custo.

## 12. Observabilidade

Toda funcionalidade implementada no VERACIS deve considerar logs estruturados, métricas relevantes e traces distribuídos, permitindo o monitoramento de erros e a criação de dashboards quando necessário.

## 13. Checklist de Nova Funcionalidade

Antes de iniciar o desenvolvimento de uma nova funcionalidade, é importante verificar se existe regra de negócio documentada, se há impacto arquitetural, se há impacto no frontend, no backend ou na infraestrutura, se há impacto na observabilidade, se existe necessidade de um ADR e se há um plano de testes definido.

## 14. Glossário

| Termo | Descrição |
|---|---|
| Alerta | Registro criado por usuários |
| Visitante | Usuário não autenticado |
| SSE | Server Sent Events |
| ADR | Architecture Decision Record |

## 15. Próximos Passos

As regras de negócio começaram a ser detalhadas em [[Regras-de-Negocio|Regras de Negócio]] (domínios de Alertas e Usuários documentados; ver lá a lista de domínios pendentes). Os próximos passos da documentação incluem continuar esse mapeamento pelos demais domínios do backend, descrever a arquitetura atual com mais profundidade, mapear a infraestrutura AWS em uso, consolidar o contexto voltado a agentes de IA e criar os ADRs referentes às principais decisões técnicas já tomadas.
