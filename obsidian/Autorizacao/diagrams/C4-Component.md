---
title: C4 Component - Autorização
tags:
  - authorization
  - diagrama
  - c4
aliases:
  - C4 Component Autorização
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# C4 — Nível 3: Componentes do Módulo Authorization

[[README|Plataforma de Autorização]] › diagrams

```mermaid
flowchart TB
    subgraph Borda["Borda (infra/http)"]
        RG["RolesGuard 🎯<br/>@MinRole — camada 1"]
        PGd["PermissionGuard 🎯<br/>@RequirePermission — camada 2 s/ recurso"]
    end

    subgraph Mod["domain/authorization 🎯"]
        AB["AbilityService<br/>can() · abilitiesOf()"]
        PSR["PermissionSetResolver<br/>piso do enum + assignments"]
        SCOPE["ScopeResolver<br/>OWN/COMMUNITY/ANY × Ownable"]
        PREG["PolicyRegistry<br/>(resource,action) → Policy[]"]
        CATC["Catálogo em código<br/>RESOURCES + PermissionKey"]
        ADM["Use cases administrativos<br/>atribuir · revogar · CRUD papéis"]
    end

    subgraph Biz["Domínios de negócio ✅"]
        POL["Policies puras<br/>(vivem aqui — [[08-Policies]])"]
        UC["Use cases<br/>chamam can() explícito"]
    end

    subgraph Infra["Infra"]
        REPO["Repositórios Prisma<br/>(4 tabelas + índices)"]
        CACHE["Cache Redis<br/>authz:pset:{userId}"]
        EVJ["Eventos → BullMQ<br/>auditoria + invalidação"]
    end

    RG -->|"session.role (O(1))"| X((decisão))
    PGd --> AB
    UC --> AB
    AB --> PSR --> CACHE
    PSR --> REPO
    AB --> SCOPE
    AB --> PREG --> POL
    ADM --> REPO
    ADM -->|"DEL síncrono"| CACHE
    ADM -.-> EVJ
    CATC --> PSR
    CATC -.seed.-> REPO
```

Invariantes visíveis no desenho: policies fora do módulo (coesão com o negócio); catálogo em código alimentando seed e resolver (uma fonte de verdade); invalidação de cache com seta **síncrona** a partir da administração, evento apenas tracejado ([[13-Cache]] §3).

## Ver também

- [[C4-Container]] · [[04-Arquitetura]] · [[10-CASL-ou-Estrategia]]
