# 🚀 VERACIS_APP

Sistema completo de gerenciamento VERACIS, construído com arquitetura moderna e escalável.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-8.0+-orange.svg)](https://pnpm.io/)

---

## 📋 Sobre o Projeto

VERACIS_APP é um sistema de gerenciamento completo que oferece:

- 🔐 Sistema de autenticação e autorização robusto
- 📊 Dashboard administrativo moderno
- 🔔 Sistema de notificações em tempo real
- 📧 Envio de emails transacionais
- 📱 Interface responsiva e intuitiva
- 🔄 Sincronização em tempo real
- 📈 Monitoramento e logs estruturados

**Stack:** NestJS + Next.js + PostgreSQL + Redis + Prisma + TypeScript

---

## 🚀 Como Rodar a Aplicação

### Pré-requisitos

- [Node.js 18+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/)

### Instalação e Execução

```bash
# 1. Instalar pnpm globalmente
npm i pnpm -g

# 2. Instalar as dependências do projeto
pnpm i

# 3. Iniciar o banco de dados (PostgreSQL + Redis via Docker)
pnpm run --filter @veracis/api docker:up

# 4. Rodar as migrations do banco de dados
pnpm run --filter @veracis/api db:deploy

# 5. Rodar o seed do banco (dados iniciais)
pnpm run --filter @veracis/api db:seed

# 6. Iniciar a aplicação em ambiente de desenvolvimento
pnpm run dev
```

✅ **Pronto!** Acesse:

- 🔴 API: http://localhost:3333
- 🔵 Web: http://localhost:3000

---

## 🎯 Comandos Úteis

### Rodar Pacotes Específicos

Para executar comandos em um pacote específico, use o filtro:

```bash
pnpm run --filter <nome-do-pacote> <comando>
```

**Exemplo:**

```bash
# Rodar apenas a API em modo desenvolvimento
pnpm run --filter @veracis/api dev

# Rodar apenas o frontend
pnpm run --filter @veracis/web dev
```

> 💡 **Dica:** Para ver os nomes dos pacotes, abra o `package.json` de cada projeto e consulte o campo `name`. Os comandos disponíveis estão listados em `scripts`.

### Outros Comandos

```bash
# Parar o banco de dados
pnpm run docker:down

# Ver logs do banco
docker-compose logs -f

# Resetar o banco de dados
pnpm run --filter @veracis/api db:reset
```

---

## 📚 Documentação

Para mais informações, consulte:

- **[Guia de Contribuição](./CONTRIBUTING.md)** - Padrões e boas práticas
- **[Documentação Completa](./docs/INDEX.md)** - Índice de toda documentação
- **Arquitetura** - Decisões técnicas e estrutura

---

Desenvolvido com ❤️ pela equipe VERACIS
