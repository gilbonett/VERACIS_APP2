---
title: C4 Context - Plataforma de Identidade
tags:
  - identity
  - auth
  - diagrama
  - c4
aliases:
  - C4 Context IAM
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# C4 — Nível 1: Contexto

[[README|Plataforma de Identidade]] › diagrams

```mermaid
C4Context
    title Contexto — Plataforma de Identidade VERACIS

    Person(cidadao, "Usuário/Cidadão", "Reporta e acompanha alertas territoriais")
    Person(staff, "Staff (LEADER/MANAGER/ROOT)", "Modera e administra")

    System(veracis, "VERACIS", "Plataforma de alertas territoriais — inclui a Plataforma de Identidade (Identity Kernel)")

    System_Ext(govbr, "GOV.BR", "Login unificado do cidadão (OIDC) — fase 10")
    System_Ext(scpa, "SCPA / Ministério da Saúde", "Perfis de acesso dos sistemas do MS — fase 10")
    System_Ext(idps, "IdPs corporativos", "LDAP/AD, Azure AD, Google, Keycloak — fase 8+")
    System_Ext(mail, "Serviço de E-mail", "Entrega OTP, reset, alertas de segurança")

    Rel(cidadao, veracis, "Usa", "HTTPS, cookie httpOnly")
    Rel(staff, veracis, "Administra", "HTTPS")
    Rel(veracis, govbr, "Federa login via", "OIDC + PKCE")
    Rel(veracis, scpa, "Mapeia perfis via", "Provider dedicado")
    Rel(veracis, idps, "Federa login via", "OIDC/LDAP")
    Rel(veracis, mail, "Envia", "SMTP/API via fila")
```

Fronteira central: **nenhum sistema externo fala com os domínios de negócio** — todo IdP entra pela camada de Providers do Identity Kernel ([[08-Providers]]); os domínios de negócio só conhecem a sessão local.

## Ver também

- [[C4-Container]] — nível 2
- [[04-Arquitetura]]
