---
title: Anexos de Alertas
tags:
  - regra-de-negocio
  - alertas
  - anexos
  - s3
aliases:
  - Alert Attachments
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Anexos

| | |
|---|---|
| **Domínio** | [[Alertas]] |
| **Caso de uso** | `CreateAlertAttachmentUseCase` |
| **Código-fonte** | `apps/api/src/domain/alerts/use-cases/create-alert-attachment.use-case.ts`, `apps/api/src/domain/alerts/entities/alert-attachment.ts` |
| **Última atualização** | 2026-07-22 |

---

## 1. Regras

- Associa um `attachmentId` já existente (upload realizado fora deste subdomínio, no armazenamento S3) a um `alertId`.
- A associação é modelada como entidade própria (`AlertAttachment`), agrupada em `AlertAttachmentList` (`WatchedList`) dentro do aggregate `Alert` — permite rastrear itens adicionados/removidos ao persistir o aggregate.
- O contrato `AlertAttachmentsRepository` expõe `createMany` e `deleteMany` — associações e remoções são sempre em lote.

## 2. Ausência de Validação de Negócio

> [!warning] Caso de uso sem checagens
> `CreateAlertAttachmentUseCase` não verifica: se o alerta referenciado existe; se o anexo referenciado existe; se o alerta está em um status que permite novos anexos; se o autor da requisição é o autor do alerta.
>
> É um caso de uso de associação pura — toda validação de propriedade do arquivo, tipo de conteúdo e existência do anexo em si é responsabilidade da camada de storage/infraestrutura (S3), fora deste subdomínio.

## 3. Contexto Relacionado

O repositório de commits do projeto registra trabalho recente de observabilidade e remoção de anexos na camada de storage (PR "remoção de anexos, observabilidade do storage") — mudanças de infraestrutura em torno de anexos acontecem fora deste subdomínio de negócio; esta página documenta apenas a regra de associação no domínio de Alertas.

## Ver também

- [[Alertas]] — índice do domínio
- [[02-Criacao-de-Alertas]]
- [[09-Consulta-de-Alertas]]
