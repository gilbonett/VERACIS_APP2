---
title: Deployment - Plataforma de Identidade
tags:
  - identity
  - auth
  - diagrama
  - deployment
aliases:
  - Deployment IAM
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Deployment

[[README|Plataforma de Identidade]] › diagrams

Infraestrutura AWS conforme [[Geral]] §5 (✅ ECS/ECR/RDS/ElastiCache/S3/Secrets Manager) + adições da plataforma (🎯).

```mermaid
flowchart TB
    U["Usuários"] --> R53["Route 53"]
    R53 --> ALB["ALB<br/>TLS · HSTS 🎯<br/>(único hop confiado — trust proxy: 1 ✅)"]

    subgraph AWS["AWS — multi-AZ"]
        subgraph ECS["ECS (Fargate/EC2)"]
            T1["Task API #1"]
            T2["Task API #2"]
            TN["Task API #N<br/>(stateless — escala horizontal ✅)"]
        end
        RDS[("RDS PostgreSQL multi-AZ<br/>sessions · users · audit_logs 🎯")]
        EC[("ElastiCache Redis multi-AZ<br/>rate limit ✅ · cache sessão 🎯 · filas ✅")]
        SM["Secrets Manager<br/>SESSION/OTP/RESET secrets ✅<br/>pepper 🎯 · chaves JWT 🎯 (fase 7)"]
        S3[("S3 + Object Lock 🎯<br/>export frio de auditoria")]
    end

    ALB --> T1 & T2 & TN
    T1 & T2 & TN --> RDS
    T1 & T2 & TN --> EC
    T1 & T2 & TN -->|boot| SM
    RDS -.export mensal 🎯.-> S3

    GOV["GOV.BR / SCPA / IdPs<br/>(egress HTTPS — fases 8-10)"]
    T1 -.OIDC.-> GOV
```

Pontos operacionais:

- **Nenhum estado em processo** — qualquer task atende qualquer request (sessão em RDS+cache) ✅.
- **Falha de AZ**: RDS failover automático; ElastiCache réplica; degradação conforme [[14-Seguranca]] §8.
- **Segredos**: carregados no boot via Secrets Manager; rotação sem redeploy exige suporte dual-secret (IDP-023).
- **Auditoria fria**: export mensal para S3 Object Lock (modo compliance) — imutabilidade fora do alcance até de administrador do banco ([[13-Auditoria]] §3).

## Ver também

- [[C4-Container]]
- [[04-Arquitetura]] §5
