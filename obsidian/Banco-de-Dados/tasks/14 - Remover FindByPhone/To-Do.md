---
title: To-Do - Remover FindByPhone
tags:
  - database
  - tasks
aliases:
  - To-Do Task 14
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# To-Do

| | |
|---|---|
| **Task** | [[00 - Descricao\|Remover ou formalizar findByPhone]] |

---

- [ ] Confirmar com o time se login/lookup por telefone é funcionalidade planejada
- [ ] Se não: remover `findByPhone` de `PrismaUserRepository`
- [ ] Se sim: declarar no contrato `UserRepository`, criar índice `users_phone_idx`, implementar o use-case correspondente
- [ ] Rodar testes do domínio de usuários
- [ ] Atualizar [[07-Plano-de-Acao-Priorizado]] marcando item 14 como concluído
