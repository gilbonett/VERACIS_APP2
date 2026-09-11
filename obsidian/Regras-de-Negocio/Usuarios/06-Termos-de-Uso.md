---
title: Termos de Uso
tags:
  - regra-de-negocio
  - usuarios
  - termos
  - compliance
aliases:
  - Terms of Service
  - Aceite de Termos
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Termos de Uso

| | |
|---|---|
| **Domínio** | [[Usuarios]] |
| **Entidades** | `Terms`, `UserTerms` |
| **Código-fonte** | `apps/api/src/domain/users/entities/terms.ts`, `user-terms.ts`, `subscribers/on-user-terms-accepted.ts` |
| **Última atualização** | 2026-07-22 |

---

## 1. Duas Entidades, Dois Propósitos

| Entidade | Representa |
|---|---|
| `Terms` | O documento de termos em si — versão, título, conteúdo, status editorial |
| `UserTerms` | O registro de que um usuário específico aceitou uma versão específica do termo, com data, IP e user agent |

## 2. Workflow Editorial de `Terms` (Modelado, Não Utilizado)

A entidade `Terms` tem um ciclo de vida completo modelado:

```
DRAFT → publish() → PUBLISHED → archive() → ARCHIVED
```

- `updateContent()` lança exceção se o termo já estiver `PUBLISHED` — regra de negócio real: **não é possível editar um termo já publicado**, apenas enquanto `DRAFT`.

> [!danger] Nenhum repositório ou caso de uso gerencia `Terms`
> Não existe `TermsRepository` nem qualquer caso de uso que crie, publique ou arquive um `Terms` dentro de `apps/api/src`. A entidade e suas regras (`publish`, `archive`, a trava de edição em `PUBLISHED`) estão implementadas, mas não são alcançáveis por nenhum fluxo da aplicação hoje. O `termsId` usado no cadastro ([[02-Registro-de-Usuario]]) precisa, portanto, já existir por algum outro meio (seed manual, migração, ou uma tela/serviço ainda não mapeado neste vault).

## 3. Registro de Aceite (`UserTerms`) — Isto Sim Está Implementado

O aceite é criado automaticamente pelo subscriber `OnUserTermsAccepted`, reagindo ao evento `UserTermsAcceptedEvent` disparado por todo `User.create()` (ver [[02-Registro-de-Usuario]], [[08-Eventos-de-Dominio]]):

```
UserTermsAcceptedEvent → OnUserTermsAccepted → UserTerms.create(userId, termsId, ipAddress, userAgent) → UserTermsRepository.create()
```

Cada aceite registra `acceptedAt`, `ipAddress` e `userAgent` — trilha de auditoria de compliance, atrelada ao momento do cadastro. Não existe fluxo para o usuário aceitar um novo termo depois de já ter uma conta (por exemplo, ao publicar uma nova versão) — o único ponto de aceite hoje é o cadastro inicial.

## Ver também

- [[Usuarios]] — índice do domínio
- [[02-Registro-de-Usuario]]
- [[08-Eventos-de-Dominio]]
- [[10-Contratos-de-Repositorio]]
