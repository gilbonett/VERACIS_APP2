---
title: C4 Container - Autorização
tags:
  - authorization
  - diagrama
  - c4
aliases:
  - C4 Container Autorização
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# C4 — Nível 2: Containers

[[README|Plataforma de Autorização]] › diagrams

A Autorização não é um container físico separado — é um **módulo do monolito NestJS** (mesma decisão do Identity Kernel, [[Autenticacao/04-Arquitetura|Arquitetura da Identidade]] §1). O diagrama mostra onde ela vive e o que toca:

```mermaid
C4Container
    title Containers — onde a Autorização vive

    Person(user, "Usuário")

    Container_Boundary(api, "API NestJS (monolito modular, ECS)") {
        Container(guards, "Guards", "SessionGuard ✅ → RolesGuard 🎯 → PermissionGuard 🎯", "cadeia de borda")
        Container(authzmod, "Módulo Authorization 🎯", "AbilityService · Resolver · Administração", "domain/authorization")
        Container(bizmod, "Domínios de Negócio ✅", "use cases + policies dos recursos", "chamam can() explícito")
    }

    ContainerDb(pg, "PostgreSQL", "roles · permissions · role_permissions · user_role_assignments (+ audit_logs da plataforma)")
    ContainerDb(rd, "Redis", "authz:pset:{userId} (TTL 300s, invalidação síncrona)")
    Container(queue, "BullMQ", "eventos → auditoria/invalidacao")

    Rel(user, guards, "request autenticado")
    Rel(guards, bizmod, "patamar ok")
    Rel(bizmod, authzmod, "can(actor, action, resource)")
    Rel(authzmod, rd, "PermissionSet (cache)")
    Rel(authzmod, pg, "resolução (miss) + administração")
    Rel(authzmod, queue, "eventos de mudança")
```

## Ver também

- [[C4-Context]] · [[C4-Component]]
- [[Autenticacao/diagrams/C4-Container|C4 Container da Identidade]] — o quadro completo do monolito
