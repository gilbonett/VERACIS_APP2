---
title: Remover include de memberships quando não usado
tags:
  - database
  - performance
  - refactor
  - media-prioridade
aliases:
  - Task 12
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Remover `include` de `memberships` em `findByEmail`/`findByCpf` quando não usado

| | |
|---|---|
| **Impacto** | Baixo-Médio |
| **Esforço** | Médio |
| **Fonte** | [[N1-Queries-Identificadas]] §2 |

---

## O que precisa ser feito

`findByEmail`, `findByCpf`, `findByPhone` e `findById` em `PrismaUserRepository` sempre trazem `memberships → community → biome` (3 níveis de join), mesmo quando o caller não usa esse dado — ex.: `SignInUseCase` só lê `user.password`/`user.otpEnabled`.

## Como fazer

Duas opções, escolher com o time antes de implementar:

1. **Parâmetro opcional**: `findByCpf(cpf: string, options?: { withMemberships?: boolean })`, e só incluir o `include` quando solicitado.
2. **Método dedicado**: manter `findByCpf` sem include, e criar `findByCpfWithMemberships` para os callers que precisam (ex.: fluxo de perfil completo).

Recomendação: opção 2 é mais alinhada ao restante do projeto (métodos de repositório explícitos, sem parâmetros de configuração opcionais escondendo comportamento — ver [[Geral]] §3, princípios de Clean Architecture já adotados).

## Como deve ficar o resultado

- `SignInUseCase` passa a chamar uma variante de `findByCpf` sem o `include` de memberships — menos joins por login.
- Callers que de fato precisam de `memberships`/`community`/`biome` (ex.: `GetProfileUseCase`) continuam com o dado completo, sem alteração de comportamento.
- Contrato abstrato `UserRepository` atualizado para refletir os métodos novos/renomeados.

## Ver também

- [[Banco-de-Dados]]
- [[00-To-Do-Geral]]
- [[12 - Include Seletivo User/To-Do|To-Do]]
