---
title: To-Do - Select Mínimo Author Alert
tags:
  - database
  - tasks
aliases:
  - To-Do Task 07
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# To-Do

| | |
|---|---|
| **Task** | [[00 - Descricao\|Trocar include author:true por select mínimo em Alert/AlertComment]] |

---

- [ ] Editar `prisma-alert-details-mapper.ts` (`include.author`, `include.community`, `include.comments.include.author`, `include.attachments`)
- [ ] Rodar `tsc`/build para confirmar que `toDomain` continua compilando
- [ ] Rodar testes do domínio de alertas
- [ ] Auditar outros `include: { relacao: true }` no repositório com `grep -rn "include:" apps/api/src/infra/database/prisma` e repetir a correção onde aplicável (ex.: `UserRepository`, task 12)
- [ ] Atualizar [[07-Plano-de-Acao-Priorizado]] marcando item 7 como concluído
