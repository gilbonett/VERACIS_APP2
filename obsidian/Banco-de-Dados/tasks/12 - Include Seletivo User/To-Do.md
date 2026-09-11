---
title: To-Do - Include Seletivo User
tags:
  - database
  - tasks
aliases:
  - To-Do Task 12
status: Ativo
versao: "1.0"
classificacao: Uso Interno
---

# To-Do

| | |
|---|---|
| **Task** | [[00 - Descricao\|Remover include de memberships quando não usado]] |

---

- [ ] Decidir com o time: parâmetro opcional vs. método dedicado
- [ ] Atualizar contrato abstrato `UserRepository`
- [ ] Atualizar `PrismaUserRepository` (`findByCpf`, `findByEmail`, `findByPhone`, `findById`)
- [ ] Atualizar `SignInUseCase` para usar a variante sem include
- [ ] Revisar demais callers (`RegisterUserUseCase`, `UpdateProfileUseCase`, `RequestPasswordResetUseCase`) e decidir qual variante cada um precisa
- [ ] Rodar testes de autenticação e perfil
- [ ] Atualizar [[07-Plano-de-Acao-Priorizado]] marcando item 12 como concluído
