# 🤝 Guia de Contribuição

Bem-vindo ao time! Este guia contém tudo que você precisa saber para contribuir com o projeto VERACIS_APP.

## 🚀 Início Rápido (TL;DR)

```bash
# 1. Clonar e instalar
git clone <url-do-repositorio>
cd VERACIS_APP
pnpm install

# 2. Configurar ambiente
cp .env.example .env

# 3. Subir banco de dados
docker-compose up -d

# 4. Rodar migrations
pnpm --filter @app/api prisma migrate dev

# 5. Iniciar desenvolvimento
pnpm dev
```

## 📋 Índice

- [🚀 Início Rápido](#início-rápido-tldr)
- [🔧 Preparação do Ambiente](#preparação-do-ambiente)
- [🔄 Fluxo de Trabalho](#fluxo-de-trabalho)
- [📝 Padrão de Commits](#padrão-de-commits)
- [💻 Padrão de Código](#padrão-de-código)
- [🏗️ Estrutura do Projeto](#estrutura-do-projeto)
- [🧪 Testes](#testes)
- [🔍 Pull Requests](#pull-requests)
- [🐳 Docker & Banco de Dados](#docker--banco-de-dados)
- [🛠️ Comandos Úteis](#comandos-úteis-do-pnpm)
- [❓ Troubleshooting](#troubleshooting)

---

## � Preparação do Ambiente

### Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** >= 18 ([Download](https://nodejs.org/))
- **pnpm** >= 8.0 (`npm install -g pnpm`)
- **Git** >= 2.0 ([Download](https://git-scm.com/))
- **Docker** & Docker Compose ([Download](https://www.docker.com/))

### Instalação Completa

#### 1️⃣ Clone o Repositório

```bash
git clone <url-do-repositorio>
cd VERACIS_APP
```

#### 2️⃣ Instale as Dependências

```bash
pnpm install
```

Isso irá:

- Instalar todas as dependências do monorepo
- Configurar os hooks do Husky automaticamente
- Preparar o ambiente para desenvolvimento

#### 3️⃣ Configure as Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo para a raiz
cp .env.example .env
```

Edite o arquivo `.env` na raiz com suas configurações locais:

**`.env` (raiz do projeto):**

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/veracis_db"

# JWT
JWT_SECRET="sua-chave-secreta-aqui"

# API
NEXT_PUBLIC_API_URL="http://localhost:3333"

# ... outras variáveis
```

> **💡 Nota**: Todas as variáveis de ambiente (API e Web) ficam em um único arquivo `.env` na raiz do projeto.

#### 4️⃣ Inicie o Banco de Dados

```bash
# Sobe os containers do Docker (PostgreSQL, Redis, etc)
docker-compose up -d

# Verifique se está rodando
docker-compose ps
```

#### 5️⃣ Execute as Migrations do Prisma

```bash
# Aplica as migrations no banco de dados
pnpm --filter @app/api prisma migrate dev

# (Opcional) Popula o banco com dados de teste
pnpm --filter @app/api prisma db seed
```

#### 6️⃣ Inicie o Ambiente de Desenvolvimento

```bash
# Inicia API e Web simultaneamente
pnpm dev

# Ou individualmente:
pnpm --filter @app/api dev    # API em http://localhost:3333
pnpm --filter @app/web dev     # Web em http://localhost:3000
```

✅ **Pronto!** Seu ambiente está configurado.

### Estrutura do Monorepo

Este projeto usa **Turborepo** + **pnpm workspaces** para gerenciar múltiplos pacotes:

```
VERACIS_APP/
├── apps/
│   ├── api/                    # 🔴 Backend NestJS
│   │   ├── prisma/            # Schemas e migrations do banco
│   │   ├── src/               # Código fonte
│   │   │   ├── core/         # Lógica de negócio (DDD)
│   │   │   ├── domain/       # Entidades e use cases
│   │   │   └── infra/        # Infraestrutura (HTTP, DB, etc)
│   │   └── test/             # Testes E2E
│   │
│   └── web/                    # 🔵 Frontend Next.js
│       ├── src/
│       │   ├── app/          # App Router (Next.js 13+)
│       │   ├── components/   # Componentes React
│       │   └── hooks/        # Custom hooks
│       └── tests/            # Testes do frontend
│
├── packages/
│   └── env/                    # ⚙️ Validação de variáveis de ambiente
│
├── configs/                    # 📝 Configurações compartilhadas
│   ├── eslint-config/        # ESLint configs
│   ├── prettier-config/      # Prettier configs
│   └── typescript-config/    # TypeScript configs
│
├── docker-compose.yml          # 🐳 Serviços Docker
├── turbo.json                  # ⚡ Configuração do Turborepo
└── pnpm-workspace.yaml         # 📦 Workspaces do pnpm
```

---

## 🔄 Fluxo de Trabalho

### 1. Crie uma Branch

Use nomes descritivos para suas branches:

```bash
# Features
git checkout -b feat/nome-da-feature

# Bugfixes
git checkout -b fix/descricao-do-bug

# Documentação
git checkout -b docs/descricao

# Refatoração
git checkout -b refactor/descricao
```

### 2. Faça Suas Alterações

Trabalhe normalmente e faça commits seguindo o padrão estabelecido.

**💡 Dicas:**

- Mantenha o servidor de desenvolvimento rodando (`pnpm dev`)
- Use o Prisma Studio para visualizar dados: `pnpm --filter @app/api prisma studio`
- Consulte os logs do Docker: `docker-compose logs -f`

### 3. Execute os Testes

```bash
# Rodar todos os testes
pnpm test

# Rodar testes de um workspace específico
pnpm --filter @app/api test
pnpm --filter @app/web test
```

### 4. Faça o Commit

O Husky vai automaticamente:

- ✅ Executar o lint nos arquivos modificados
- ✅ Validar a mensagem do commit
- ✅ Rodar testes relacionados (se configurado)

---

## 📝 Padrão de Commits

Este projeto segue o [Conventional Commits](https://www.conventionalcommits.org/).

### Formato Básico

```
<tipo>(<escopo>): <descrição>

[corpo opcional]

[rodapé opcional]
```

### Tipos de Commit

| Tipo       | Descrição                        | Exemplo                                    |
| ---------- | -------------------------------- | ------------------------------------------ |
| `feat`     | Nova funcionalidade              | `feat: adiciona autenticação JWT`          |
| `fix`      | Correção de bug                  | `fix: corrige validação de email`          |
| `docs`     | Documentação                     | `docs: atualiza guia de contribuição`      |
| `style`    | Formatação (não afeta lógica)    | `style: formata arquivo de configuração`   |
| `refactor` | Refatoração de código            | `refactor: reorganiza estrutura de pastas` |
| `perf`     | Melhoria de performance          | `perf: otimiza query do banco de dados`    |
| `test`     | Adição ou modificação de testes  | `test: adiciona testes unitários do login` |
| `build`    | Sistema de build ou dependências | `build: atualiza configuração do webpack`  |
| `ci`       | Integração contínua              | `ci: adiciona workflow do GitHub Actions`  |
| `chore`    | Tarefas gerais/manutenção        | `chore: atualiza dependências`             |
| `revert`   | Reverter commit anterior         | `revert: reverte commit abc123`            |

### Escopo (Opcional)

O escopo especifica qual parte do projeto foi afetada:

```bash
feat(api): adiciona endpoint de usuários
fix(web): corrige layout responsivo
docs(readme): adiciona instruções de deploy
chore(deps): atualiza React para v18
```

### Exemplos Completos

#### Commit Simples

```bash
git commit -m "feat: adiciona página de dashboard"
```

#### Commit com Escopo

```bash
git commit -m "fix(auth): corrige expiração de token JWT"
```

#### Commit com Corpo

```bash
git commit -m "feat(api): adiciona sistema de notificações

- Implementa WebSocket para notificações em tempo real
- Adiciona serviço de email
- Cria tabela de notificações no banco"
```

#### Commit com Breaking Change

```bash
git commit -m "feat(api)!: migra autenticação para OAuth2

BREAKING CHANGE: A autenticação básica foi removida.
Todos os clientes devem migrar para OAuth2."
```

#### Commit Relacionado a Bugs

```bash
git commit -m "fix(web): corrige erro de carregamento infinito

Closes #123"
```

### ❌ Exemplos Inválidos

```bash
# Sem tipo
git commit -m "adiciona nova funcionalidade"

# Tipo errado
git commit -m "add: nova funcionalidade"

# Falta descrição
git commit -m "feat:"

# Primeira letra maiúscula
git commit -m "feat: Adiciona nova funcionalidade"

# Ponto final
git commit -m "feat: adiciona nova funcionalidade."
```

### ✅ Boas Práticas

1. **Use o imperativo**: "adiciona" em vez de "adicionado" ou "adicionando"
2. **Seja conciso**: máximo de 72 caracteres na primeira linha
3. **Primeira letra minúscula**: após o tipo e dois pontos
4. **Sem ponto final**: na descrição curta
5. **Use o corpo**: para explicar o "porquê" e não o "o quê"
6. **Referencie issues**: quando aplicável

---

## 💻 Padrão de Código

### Linting e Formatação

O projeto usa:

- **ESLint** para linting
- **Prettier** para formatação

```bash
# Rodar lint em todo o projeto
pnpm lint

# Rodar lint em um workspace específico
pnpm --filter @app/api lint
pnpm --filter @app/web lint

# Formatar código
pnpm format
```

### Configuração do Editor

Recomendamos usar VSCode com as seguintes extensões:

- ESLint
- Prettier
- EditorConfig

Crie `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

### Convenções de Nomenclatura

#### TypeScript/JavaScript

```typescript
// Componentes React: PascalCase
export const UserProfile = () => {};

// Funções e variáveis: camelCase
const getUserData = () => {};
const isAuthenticated = true;

// Constantes: UPPER_SNAKE_CASE
const API_BASE_URL = "https://api.example.com";

// Tipos e Interfaces: PascalCase
interface UserData {}
type ApiResponse = {};

// Arquivos de componentes: PascalCase
UserProfile.tsx;

// Outros arquivos: kebab-case
user - service.ts;
auth - utils.ts;
```

---

## 🧪 Testes

### Estrutura de Testes

```typescript
// user.service.spec.ts
describe("UserService", () => {
  let service: UserService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  describe("findOne", () => {
    it("deve retornar um usuário", async () => {
      const result = await service.findOne(1);
      expect(result).toBeDefined();
    });

    it("deve lançar erro quando usuário não existe", async () => {
      await expect(service.findOne(999)).rejects.toThrow();
    });
  });
});
```

### Comandos de Teste

```bash
# Rodar todos os testes
pnpm test

# Modo watch
pnpm test:watch

# Cobertura
pnpm test:cov

# Testes e2e
pnpm test:e2e

# Testes de um workspace específico
pnpm --filter @app/api test
pnpm --filter @app/web test
```

### Cobertura de Testes

Mantenha a cobertura acima de:

- **80%** para statements
- **75%** para branches
- **80%** para functions
- **80%** para lines

---

## 🔍 Pull Requests

### Antes de Abrir um PR

1. ✅ Certifique-se que todos os testes passam
2. ✅ Execute o lint e corrija todos os problemas
3. ✅ Atualize a documentação se necessário
4. ✅ Faça rebase com a branch principal
5. ✅ Revise suas próprias mudanças

### Título do PR

Use o mesmo padrão dos commits:

```
feat(api): adiciona endpoint de notificações
fix(web): corrige bug no formulário de login
docs: atualiza guia de contribuição
```

### Descrição do PR

Use o template:

```markdown
## 📝 Descrição

Breve descrição do que foi feito e por quê.

## 🔗 Issue Relacionada

Closes #123

## 🧪 Como Testar

1. Passo 1
2. Passo 2
3. Passo 3

## 📸 Screenshots (se aplicável)

[Adicione screenshots ou GIFs]

## ✅ Checklist

- [ ] Testes adicionados/atualizados
- [ ] Documentação atualizada
- [ ] Lint passou sem erros
- [ ] Testado localmente
- [ ] Breaking changes documentadas (se houver)
```

### Code Review

Ao revisar PRs:

1. **Seja respeitoso e construtivo**
2. **Foque no código, não na pessoa**
3. **Explique o "porquê"** das suas sugestões
4. **Aprove quando estiver satisfeito**

### Merge

- Use **Squash and Merge** para manter histórico limpo
- Certifique-se que a mensagem final do merge segue o padrão de commits

---

## 🐳 Docker & Banco de Dados

### Comandos Docker

```bash
# Iniciar todos os serviços
docker-compose up -d

# Ver logs dos containers
docker-compose logs -f

# Parar os serviços
docker-compose down

# Recriar os containers
docker-compose down -v && docker-compose up -d

# Ver status dos containers
docker-compose ps
```

### Comandos Prisma

```bash
# Criar uma nova migration
pnpm --filter @app/api prisma migrate dev --name nome_da_migration

# Aplicar migrations
pnpm --filter @app/api prisma migrate deploy

# Resetar o banco de dados (CUIDADO! Apaga todos os dados)
pnpm --filter @app/api prisma migrate reset

# Abrir Prisma Studio (interface visual para o banco)
pnpm --filter @app/api prisma studio

# Gerar o Prisma Client (após alterar o schema)
pnpm --filter @app/api prisma generate

# Verificar status das migrations
pnpm --filter @app/api prisma migrate status
```

### Estrutura do Banco de Dados

O projeto usa **PostgreSQL** com **Prisma ORM**. O schema está em:

- 📄 `apps/api/prisma/schema.prisma`

---

## 🔧 Comandos Úteis do pnpm

### Desenvolvimento

```bash
# Iniciar ambiente de desenvolvimento (API + Web)
pnpm dev

# Iniciar apenas a API
pnpm --filter @app/api dev

# Iniciar apenas o Web
pnpm --filter @app/web dev

# Build de produção
pnpm build

# Build de um workspace específico
pnpm --filter @app/api build
```

### Gerenciamento de Dependências

```bash
# Instalar uma dependência em um workspace específico
pnpm --filter @app/api add <pacote>
pnpm --filter @app/web add <pacote>

# Instalar dependência de desenvolvimento
pnpm --filter @app/api add -D <pacote>

# Instalar dependência na raiz (monorepo)
pnpm add -w <pacote>

# Remover uma dependência
pnpm --filter @app/api remove <pacote>

# Atualizar todas as dependências
pnpm update

# Atualizar uma dependência específica
pnpm --filter @app/api update <pacote>
```

### Scripts Úteis

```bash
# Rodar lint em todo o projeto
pnpm lint

# Rodar lint e corrigir automaticamente
pnpm lint:fix

# Rodar testes
pnpm test

# Rodar testes em modo watch
pnpm test:watch

# Rodar testes E2E
pnpm --filter @app/api test:e2e

# Ver cobertura de testes
pnpm test:cov

# Limpar caches e node_modules
pnpm clean
pnpm install
```

### Workspaces

```bash
# Ver a estrutura dos workspaces
pnpm -r list

# Rodar um script em todos os workspaces
pnpm -r <script>

# Rodar um script em um workspace específico
pnpm --filter @app/api <script>

# Ver dependências de um workspace
pnpm --filter @app/api list
```

---

## ❓ Troubleshooting

### Problema: Erro ao instalar dependências

```bash
# Limpe o cache do pnpm
pnpm store prune

# Remova node_modules e reinstale
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

### Problema: Erro de conexão com o banco de dados

```bash
# Verifique se o Docker está rodando
docker-compose ps

# Reinicie os containers
docker-compose restart

# Verifique se a porta 5432 está livre
lsof -i :5432

# Verifique o DATABASE_URL no .env
cat .env | grep DATABASE_URL
```

### Problema: Erro no Prisma Client

```bash
# Regenere o Prisma Client
pnpm --filter @app/api prisma generate

# Se persistir, recrie as migrations
pnpm --filter @app/api prisma migrate reset
```

### Problema: Portas já em uso

```bash
# Verifique o que está usando a porta
lsof -i :3000  # Web
lsof -i :3333  # API

# Mate o processo
kill -9 <PID>
```

### Problema: Husky não está funcionando

```bash
# Reinstale os hooks do Husky
pnpm husky install

# Dê permissão aos hooks
chmod +x .husky/*
```

### Problema: Erro "module not found"

```bash
# Limpe o cache do Next.js (Web)
rm -rf apps/web/.next

# Limpe o cache do NestJS (API)
rm -rf apps/api/dist

# Reconstrua o projeto
pnpm build
```

---

## 🆘 Precisa de Ajuda?

- 📖 Leia a [documentação completa](./docs)
- 💬 Abra uma [issue](../../issues) para reportar bugs
- 🤝 Entre em contato com o time responsável
- 📚 Consulte os READMEs específicos:
  - [API README](./apps/api/README.md)
  - [Web README](./apps/web/README.md)

---

## 📚 Recursos Adicionais

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Turborepo Docs](https://turbo.build/repo/docs)
- [NestJS Docs](https://docs.nestjs.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Obrigado por contribuir! 🎉**
