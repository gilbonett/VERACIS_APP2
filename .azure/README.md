# Azure DevOps — Setup Completo (Turborepo)

## Estrutura de arquivos

```
.azure/pipelines/
  templates/
    detect-changes.yml        # Detecta mudanças em apps/api e apps/web
    build-and-push.yml        # Build Docker + 3 tags ECR (por app)
    deploy-ecs.yml            # Deploy ECS + migration + diagnóstico (por app)
    create-promote-pr.yml     # Cria promote/ + abre PR → production
    cleanup.yml               # Tag v* + deleta promote/
    notify.yml                # Notificações Teams/Slack
  qa-pipeline.yml             # Disparado pela tag qa-*
  production-pipeline.yml     # Disparado pelo merge em production
```

---

## Lógica de detecção de mudanças

```
git tag qa-1.0.0
        │
        ▼
Detecta arquivos modificados desde o commit anterior
        │
  ┌─────┴─────┐
  │           │
apps/api   apps/web    pnpm-lock.yaml / turbo.json
  │           │                    │
  ▼           ▼                    ▼
Build API  Build Web        Build API + Web
Deploy API Deploy Web       Deploy API + Web
  │           │                    │
  └─────┬─────┘                    │
        ▼                          │
   PR promote/ → production ←──────┘
```

**Arquivos que forçam rebuild de ambos:**
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `package.json`
- `turbo.json`

---

## Variable Groups — criar em Pipelines > Library

### `Veracis-Registry` (já existe)
| Variável | Valor |
|---|---|
| `AWS_REGION` | `sa-east-1` |
| `AWS_SERVICE_CONNECTION` | `veracis-aws-oidc` |
| `ECR_REGISTRY` | `522814724197.dkr.ecr.sa-east-1.amazonaws.com` |
| `ECR_API_REPOSITORY` | `veracis-api` |
| `ECR_WEB_REPOSITORY` | `veracis-web` |

### `Veracis-Deploy` (já existe — ambiente QA)
| Variável | Valor |
|---|---|
| `ECS_CLUSTER` | `veracis-e5-ecs-testing` |
| `ECS_SERVICE_API` | `veracis-e5-service-api-testing` |
| `ECS_SERVICE_WEB` | `veracis-e5-service-web-testing` |
| `ECS_TASK_DEFINITION_FAMILY_API` | `veracis-e5-task-api-testing` |
| `ECS_TASK_DEFINITION_FAMILY_WEB` | `veracis-e5-task-web-testing` |
| `ECS_CONTAINER_API` | `veracis-e5-api` |
| `ECS_CONTAINER_WEB` | `veracis-e5-web` |

### `Veracis-Deploy-Production` (criar)
| Variável | Valor |
|---|---|
| `ECS_CLUSTER_PROD` | `veracis-e5-plataform` |
| `ECS_SERVICE_API_PROD` | `veracis-e5-service-api-production` |
| `ECS_SERVICE_WEB_PROD` | `veracis-e5-service-web-production` |
| `ECS_TASK_DEFINITION_FAMILY_API_PROD` | `veracis-e5-task-api-production` |
| `ECS_TASK_DEFINITION_FAMILY_WEB_PROD` | `veracis-e5-task-web-production` |

### `Veracis-DevOps-Config` (criar)
| Variável | Tipo | Valor |
|---|---|---|
| `AZURE_DEVOPS_ORG` | texto | `https://dev.azure.com/sua-org` |
| `AZURE_DEVOPS_PROJECT` | texto | `VERACIS` |
| `AZURE_DEVOPS_PAT` | **secret** | `xxxxxxxxxxxx` |
| `TEAMS_WEBHOOK_URL` | **secret** | `https://outlook.office.com/webhook/...` |
| `TECH_LEAD_EMAIL` | texto | `techlead@empresa.com` |

### `Veracis-Api-Build-Variables` (já existe)
- `DATABASE_URL` (secret)

### `Veracis-Web-Build-Variables` (já existe)
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`
- `JWT_PUBLIC_KEY` (secret)

---

## Environments — Pipelines > Environments

### `QA`
- Approval Gate: time de QA
- Instructions: "O ambiente QA está livre para novo deploy?"
- Exclusive Lock: ✅
- Timeout: 7 dias

### `Production`
- Approval Gate: Tech Lead
- Instructions: "Confirmar deploy em produção?"
- Timeout: 2 dias

---

## Registrar os pipelines

### qa-pipeline
- Arquivo: `.azure/pipelines/qa-pipeline.yml`
- Nome: `[QA] VERACIS`

### production-pipeline
- Arquivo: `.azure/pipelines/production-pipeline.yml`
- Nome: `[PROD] VERACIS`

---

## Como usar

```bash
# Só API mudou
git tag qa-1.0.1 && git push origin qa-1.0.1
# → Build API + Deploy API no QA
# → Web não é tocado

# Só Web mudou
git tag qa-1.1.0 && git push origin qa-1.1.0
# → Build Web + Deploy Web no QA
# → API não é tocada

# Ambos mudaram (ou pnpm-lock.yaml/turbo.json mudaram)
git tag qa-2.0.0 && git push origin qa-2.0.0
# → Build API + Build Web em paralelo
# → Deploy API + Deploy Web em paralelo no QA

# Em todos os casos: um único PR promote/ → production é criado
```

---

## Tags publicadas no ECR por build

Cada build publica 3 tags apontando para a mesma imagem:

| Tag | Exemplo | Uso |
|---|---|---|
| SHA do commit | `7c9af31` | Rastreabilidade |
| Versão semântica | `1.0.0` | Legibilidade e rollback |
| latest | `latest` | Sempre o mais recente |
