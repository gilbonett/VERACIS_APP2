# 🌿 Contribuições — Padrão de Git

Fluxo de git para contribuir em qualquer projeto que use Azure DevOps. Padrão de código, testes e setup ficam no `CONTRIBUTING.md` de cada repositório.

## 1. Branch

**Com work item no Azure DevOps** (caso mais comum):

```
<work-item-id>-descricao-curta
```

```bash
git checkout -b 1920-corrige-sse-leak
git checkout -b 1785-refactor-for-new-flow
```

**Sem work item** (ajuste pontual, sem task aberta): prefixa com o tipo, mesmos tipos usados no commit.

```
<tipo>-descricao-curta
```

```bash
git checkout -b feat-nova-tela-dashboard
git checkout -b fix-validacao-email
git checkout -b chore-atualiza-deps
```

Tipos disponíveis: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

## 2. Commits

Conventional Commits.

```
<tipo>(<escopo opcional>): <descrição>
```

```bash
git commit -m "feat(api): adiciona endpoint de notificações"
git commit -m "fix(auth): corrige expiração de token JWT"
git commit -m "chore(deps): atualiza React para v18"
```

Boas práticas:

- Imperativo: "adiciona", não "adicionado"/"adicionando"
- Minúscula após `tipo:`
- Sem ponto final
- Até 72 caracteres na primeira linha
- Corpo opcional explica o **porquê**, não o que (o diff já mostra o quê)

Breaking change:

```bash
git commit -m "feat(api)!: migra autenticação para OAuth2

BREAKING CHANGE: autenticação básica removida."
```

## 3. Sincronizar com a main

Antes de abrir ou atualizar um PR, atualize a branch com rebase — mantém histórico linear, sem merge commit desnecessário.

```bash
git fetch origin
git rebase origin/main
# ou, se a branch já tem upstream:
git pull --rebase
```

Resolva conflitos, `git rebase --continue`, depois `git push --force-with-lease` (nunca `--force` puro).

## 4. Pull Request

**Título** segue o mesmo padrão dos commits — vira a mensagem final do squash:

```
feat(api): adiciona endpoint de notificações
fix(web): corrige bug no formulário de login
```

**Estrutura da descrição:**

```markdown
## 📝 Descrição

Breve descrição do que foi feito e por quê.

## 🔗 Work Item

Relacionado a #1920

## 🧪 Como Testar

1. Passo 1
2. Passo 2
3. Passo 3

## 📸 Screenshots (se aplicável)

[Adicione screenshots ou GIFs]

## ✅ Checklist

- [ ] Testes passam
- [ ] Lint sem erros
- [ ] Rebase feito com a main
- [ ] Documentação atualizada (se necessário)
- [ ] Breaking changes documentadas (se houver)
```

**Antes de abrir:**

- [ ] Testes passam
- [ ] Lint sem erros
- [ ] Rebase feito com a main
- [ ] Descrição preenchida com o template acima

## 5. Merge

Completar PR no Azure DevOps com **Squash commit**. Todos os commits da branch viram um único commit na main, com o título do PR como mensagem — por isso o título precisa seguir o padrão de commit.

Depois do merge, apague a branch remota (opção padrão do Azure DevOps ao completar).
