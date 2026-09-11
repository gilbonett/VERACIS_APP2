---
title: C4 Component - Identity Kernel
tags:
  - identity
  - auth
  - diagrama
  - c4
aliases:
  - C4 Component IAM
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# C4 — Nível 3: Componentes do Identity Kernel

[[README|Plataforma de Identidade]] › diagrams

```mermaid
flowchart TB
    subgraph HTTP["Borda HTTP (infra)"]
        SG["SessionGuard ✅<br/>cookie → HMAC → sessão"]
        RG["RolesGuard 🎯 Task 15<br/>@MinRole hierárquico"]
        CTRL["Controllers de auth ✅<br/>sign-in · otp · reset · sessions 🎯 · mfa 🎯"]
    end

    subgraph Kernel["Identity Kernel (domain/auth)"]
        ORCH["Sign-In Orchestrator 🎯<br/>(hoje: SignInUseCase ✅)<br/>status · lockout · MFA · sessão"]
        REG["ProviderRegistry 🎯"]
        LP["LocalProvider 🎯<br/>(lógica extraída do use case)"]
        OP["OidcProvider genérico 🎯<br/>GovBr/Scpa dedicados fase 10"]
        SM["Session Manager ✅/🎯<br/>emissão · validação · revogação<br/>cache Redis (ADR-012)"]
        MFA["MFA Service 🟡<br/>OtpChallenge ✅ → MfaSecret 🎯"]
        PWD["Password Service ✅/🎯<br/>reset ✅ · Argon2id+pepper 🎯"]
        TOK["Token Service 🎯 fase 7<br/>JWT ES256 · JWKS · refresh família"]
    end

    subgraph Consumo["Consumidores de eventos"]
        AUD["AuditEventSubscriber 🎯 → audit_logs"]
        NOT["Mail subscribers ✅ → fila MAIL"]
    end

    subgraph Deps["Dependências"]
        USR["UserRepository ✅<br/>(leitura: status/role/senha)"]
        CRYPTO["HmacService ✅ · HashComparer ✅"]
    end

    CTRL --> ORCH
    SG --> RG
    ORCH --> REG --> LP & OP
    ORCH --> SM
    ORCH --> MFA
    ORCH --> USR
    LP --> USR
    LP --> CRYPTO
    SM --> CRYPTO
    SM --> TOK
    PWD --> CRYPTO
    ORCH -.eventos.-> AUD & NOT
    SM -.eventos.-> AUD
```

Legenda: ✅ existe · 🎯 proposto · 🟡 parcial. A regra de fronteira: componentes do Kernel nunca importam domínios de negócio; a comunicação de saída é só por eventos ([[16-Eventos]]).

## Ver também

- [[C4-Container]] — nível 2
- [[05-Dominios]]
