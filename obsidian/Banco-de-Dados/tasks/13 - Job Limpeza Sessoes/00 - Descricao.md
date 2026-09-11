---
title: Implementar exclusão real em OnCleanExpiredSessionTask
tags:
  - database
  - performance
  - manutencao
  - baixa-prioridade
aliases:
  - Task 13
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# Implementar exclusão real em `OnCleanExpiredSessionTask`

| | |
|---|---|
| **Impacto** | Baixo hoje / Médio a longo prazo |
| **Esforço** | Baixo |
| **Fonte** | [[Outras-Oportunidades]] §3 |

---

## O que precisa ser feito

O cron horário `OnCleanExpiredSessionTask` existe mas não executa nenhuma exclusão — é um stub. `sessions` cresce sem bound porque linhas expiradas nunca são removidas.

## Como fazer

Adicionar um método `deleteExpired()` ao contrato `SessionRepository` e implementá-lo em `PrismaSessionRepository` usando `updateMany`/`deleteMany` (mesmo padrão já usado em `OtpChallengeRepository.expirePendingByUserId`):

```ts
async deleteExpired(): Promise<void> {
  await this.prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
}
```

Chamar esse método dentro de `OnCleanExpiredSessionTask`, substituindo o corpo stub.

## Como deve ficar o resultado

- `sessions` deixa de crescer indefinidamente — a cada execução horária, linhas com `expires_at` no passado são removidas.
- `COUNT(*) FROM sessions` estabiliza em vez de crescer monotonicamente ao longo do tempo.
- Índice `sessions_expiresAt_idx` (já existente) passa a ser efetivamente usado por este job, além de já servir a outras consultas.

## Ver também

- [[Banco-de-Dados]]
- [[00-To-Do-Geral]]
- [[13 - Job Limpeza Sessoes/To-Do|To-Do]]
