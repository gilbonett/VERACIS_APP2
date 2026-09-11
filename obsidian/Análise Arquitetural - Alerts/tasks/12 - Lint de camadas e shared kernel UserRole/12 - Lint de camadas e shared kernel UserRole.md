---
title: Task 12 - Lint de camadas e shared kernel UserRole
tags:
  - alerts
  - clean-architecture
  - task
severidade: Média
esforco: Baixo
fase: 2
status: pendente
---

#alerts #clean-architecture #task

# Task 12 — Lint de camadas + formalizar shared kernel

> Origem: [[Dependências Indevidas entre Camadas]] · TODO geral: [[00 - TODO Geral]]
> Pré-requisito: [[07 - Tirar telemetria do dominio|Task 07]] (senão o lint nasce quebrado).

## O que fazer

Duas travas estruturais baratas:

1. **Lint de camadas**: proibir import de `@/infra` dentro de `apps/api/src/domain/**` — elimina a classe de regressão V1/V2 permanentemente.
2. **Shared kernel `UserRole`**: tipo importado de `domain/users/entities/user` por 6+ arquivos do Alerts — mover para `@/core` (ou `@/shared`), formalizando o contrato entre subdomínios. Bônus: mover a porta `AlertDispatcher` de `domain/queue/` para `domain/alerts/gateways/` (posse explícita).

## Como fazer

**Lint** — opção leve sem dependência nova (avaliar primeiro): script de CI com grep:

```bash
# scripts/check-layer-imports.sh
violations=$(grep -rn "from \"@/infra" apps/api/src/domain --include="*.ts" || true)
if [ -n "$violations" ]; then
  echo "❌ domain importando infra:"; echo "$violations"; exit 1
fi
```

Opção robusta: `dependency-cruiser` com regra `domain !→ infra` (pega também imports relativos e re-exports). Começar pelo grep no CI; migrar se aparecer falso-negativo.

**UserRole**:
1. Criar `apps/api/src/core/types/user-role.ts` (ou `shared/`): `export type UserRole = "MEMBER" | "LEADER" | "MANAGER" | "ROOT";`
2. `domain/users/entities/user.ts` re-exporta do novo local (compatibilidade) — call sites migram gradualmente ou num find-replace único.

**AlertDispatcher**: mover arquivo para `domain/alerts/gateways/alert-dispatcher.ts`, atualizar imports (dispatcher da infra, subscribers, módulo).

## Resultado esperado

- CI falha em qualquer PR que introduza `domain → infra`.
- `UserRole` com dono neutro; Alerts sem import da entidade de Users para um tipo.
- `domain/queue/` removido (porta realocada para o Alerts).

## Checklist

- [ ] Script/regra de lint no CI (rodando no pipeline atual)
- [ ] CI vermelho comprovado com violação de teste (sanity check)
- [ ] `UserRole` movido para core/shared + re-export de compatibilidade
- [ ] Imports do Alerts atualizados
- [ ] `AlertDispatcher` movido para `domain/alerts/gateways/`
- [ ] `domain/queue/` removido; build + suites verdes
