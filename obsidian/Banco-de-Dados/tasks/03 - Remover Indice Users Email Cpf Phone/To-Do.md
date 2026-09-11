---
title: To-Do - Remover Índice Users Email Cpf Phone
tags:
  - database
  - tasks
aliases:
  - To-Do Task 03
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# To-Do

| | |
|---|---|
| **Task** | [[00 - Descricao\|Remover índice redundante users_email_cpf_phone_idx]] |

---

- [ ] Confirmar via `grep -rn "cpf.*phone\|phone.*cpf" apps/api/src` que nenhuma query nova passou a combinar as 3 colunas desde esta auditoria
- [ ] Remover `@@index([email, cpf, phone])` de `user.prisma`
- [ ] Rodar `prisma migrate dev --name drop_users_email_cpf_phone_idx`
- [ ] Rodar testes de autenticação (`sign-in`, `register-user`)
- [ ] Aplicar em produção
- [ ] Atualizar [[07-Plano-de-Acao-Priorizado]] marcando item 3 como concluído
