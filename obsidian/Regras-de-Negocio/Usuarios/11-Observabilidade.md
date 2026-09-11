---
title: Observabilidade - Usuários
tags:
  - regra-de-negocio
  - usuarios
  - observabilidade
  - opentelemetry
aliases:
  - User Observability
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Observabilidade

| | |
|---|---|
| **Domínio** | [[Usuarios]] |
| **Código-fonte** | `apps/api/src/domain/users/` |
| **Última atualização** | 2026-07-22 |

---

## 1. Cobertura Atual

| Decorator | Onde é aplicado neste domínio |
|---|---|
| `@ObserveBusiness` | **Nenhum caso de uso** — busca por `ObserveBusiness` em `domain/users/` não retorna nenhuma ocorrência |
| `@ObserveEvent` | `OnUserRegistered`, `OnUserTermsAccepted` (subscribers) |
| `@ObserveQueue` | Não aplicável — este domínio não possui filas próprias (diferente de [[13-Observabilidade|Observabilidade - Alertas]]) |

> [!danger] Nenhum caso de uso de negócio instrumentado
> `RegisterUserUseCase`, `ChangePasswordUseCase`, `UpdateProfileUseCase`, `EnableOtpUseCase`, `CompleteMapTutorialUseCase`, `GetProfileUseCase`, `GetUserByIdUseCase`, `ListUsersUseCase` e `GetUserIdsByCommunityIdUseCase` — nenhum deles tem `@ObserveBusiness`. Diferente de `CreateAlertUseCase` no domínio de Alertas, não há métricas nem traces de fluxo de negócio para nenhuma operação de conta, perfil, senha ou OTP hoje.
>
> Considerando que este domínio cobre fluxos sensíveis (senha, OTP, cadastro), a ausência de instrumentação de negócio é uma lacuna a priorizar — especialmente para `ChangePasswordUseCase` e `EnableOtpUseCase`, onde volume de tentativas com falha é um sinal de segurança relevante.

## 2. Eventos Observados

Apenas os subscribers de eventos (`OnUserRegistered`, `OnUserTermsAccepted`) têm `@ObserveEvent({ name })`, seguindo o mesmo padrão usado em [[13-Observabilidade|Observabilidade - Alertas]]. O consumidor cross-domain `OnUserCreated` (em `domain/notifications`) também usa `@ObserveEvent`, fora do escopo direto deste domínio.

## Ver também

- [[Usuarios]] — índice do domínio
- [[08-Eventos-de-Dominio]]
- [[Geral|VERACIS]] §12
