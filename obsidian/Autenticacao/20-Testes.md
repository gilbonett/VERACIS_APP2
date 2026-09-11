---
title: Testes - Plataforma de Identidade
tags:
  - identity
  - auth
  - testes
aliases:
  - Testes IAM
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Estratégia de Testes

| | |
|---|---|
| **Domínio** | [[README\|Plataforma de Identidade]] |
| **Última atualização** | 2026-07-24 |

---

## 1. Base Existente — ✅

O projeto já testa use cases com repositórios in-memory (padrão Clean Architecture — domínio testável sem infra) e specs de guards. Toda a estratégia abaixo **estende** esse padrão, não o substitui.

## 2. Pirâmide por Camada

| Camada | O que testa | Ferramenta/padrão |
|---|---|---|
| Unidade — entidades | Invariantes: `Session.renewIfNeeded` (janela 24h), `OtpChallenge.verifyCode` (5 tentativas → EXPIRED), `Password.create`, transições de `MfaSecret` | Specs puras, sem mock de infra |
| Unidade — policies | Funções puras de autorização (camada 2) — tabela de casos por papel/atributo | Idem |
| Unidade — providers | Contrato `IdentityProvider` com IdP fake: sucesso, credencial inválida, payload malformado, mapeamento → `IdentityResult` | Mock do transporte, nunca do contrato |
| Integração — use cases | Fluxos com repositórios in-memory (padrão ✅): sign-in (status × lockout × MFA), reset (cascata de revogação), rotação de refresh | Padrão existente |
| Integração — guards | `SessionGuard` (cookie→sessão), `RolesGuard` (6 cenários da Task 15) | Spec de guard existente como template |
| E2E | Rotas de [[15-API]] com banco/Redis efêmeros: login→uso→logout, reset ponta a ponta, listagem/revogação de sessões | supertest + testcontainers (ou docker-compose de CI) |

## 3. Testes de Corrida (obrigatórios — bugs de auth vivem aqui)

- Revogação × validação concorrente com cache (IDP-008): revogar durante burst de requests — nenhuma request pós-revogação passa além da janela documentada.
- Refresh rotation concorrente (IDP-015): dois refreshes simultâneos do mesmo token — um vence, retry legítimo na janela de graça não detona a família; reuso real detona.
- Lockout: N requests paralelas de senha errada — contador não perde incrementos (atomicidade Redis).

## 4. Testes de Segurança Automatizados (fase 9, rodando em CI desde antes)

| Caso | Verifica |
|---|---|
| Anti-enumeração | Resposta/timing idênticos: CPF inexistente × senha errada × conta bloqueada × conta em cooldown |
| Cookie flags | `httpOnly`, `secure` (prod), `sameSite` presentes em toda emissão |
| Sessão pós-reset | Nenhuma sessão antiga válida após confirmação de reset (cascata ✅) |
| 401 × 403 | Não autenticado nunca recebe 403; autenticado sem papel nunca recebe 401 |
| Headers | HSTS/CSP/nosniff presentes nas respostas |
| OTP força bruta | 6ª tentativa sempre falha mesmo com código correto |
| JWT (fase 7) | `alg: none` e HS256 rejeitados; `aud`/`iss` errados rejeitados; token expirado rejeitado; kid desconhecido rejeitado |
| Imutabilidade de audit | UPDATE/DELETE em `audit_logs` falha no nível do banco |

## 5. Critério Transversal

Nenhuma task de [[19-Tasks]] fecha sem os testes do seu nível; fluxo crítico de autenticação exige regressão completa antes de refactor (pré-condição explícita de IDP-005). Cobertura não é meta numérica — a meta é **todo caso da matriz de segurança (§4) automatizado**.

## Ver também

- [[README]] — índice
- [[19-Tasks]]
- [[14-Seguranca]]
