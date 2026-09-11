# VERACIS Q&A API

API do projeto VERACIS, construído com NestJS e seguindo os princípios de Clean Architecture.

## Descrição

Esta aplicação é o back-end para uma plataforma voltada ao apoio de comunidades quilombolas diante de desastres climáticos. O sistema busca oferecer ferramentas para monitoramento e gestão de situações de risco, permitindo melhor comunicação e suporte em casos de enchentes, queimadas, deslizamentos, secas e surtos de doenças. A solução é desenvolvida com foco em escalabilidade e manutenção, utilizando uma arquitetura limpa que facilita a separação de responsabilidades, acelera o desenvolvimento e garante maior confiabilidade nos testes.

## Principais Tecnologias

- **Framework:** [NestJS](https://nestjs.com/)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Banco de Dados:** [PostgreSQL](https://www.postgresql.org/) (utilizado com Prisma)
<!-- - **Autenticação:** [JWT](https://jwt.io/) (JSON Web Tokens) -->
- **Testes:** [Vitest](https://vitest.dev/)
- **Cache:** [Redis](https://redis.io/)
<!-- - **Upload de Arquivos:** Suporte para upload de arquivos (ex: R2 Storage) -->
- **Linting:** [ESLint](https://eslint.org/)
- **Validação:** [Zod](https://zod.dev/)

## Arquitetura

O projeto segue os princípios da **Clean Architecture**, separando o código em quatro camadas principais:

- `src/core`: Contém a lógica de negócio mais genérica e os blocos de construção do domínio (Entidades, Value Objects, Use Cases, etc.).
- `src/domain`: Contém a lógica de negócio específica da aplicação, dividida por contextos (ex: `forum`, `notification`).
- `src/infra`: Contém os detalhes de implementação, como controladores HTTP, módulos do NestJS, acesso ao banco de dados, etc.
- `test`: Contém os testes da aplicação, incluindo testes unitários e end-to-end.

## Rotas da API (Endpoints)

A seguir, a lista de rotas disponíveis na API:

### Autenticação

- N/A

### Usuários

- `POST /usres`: Criar um novo usuário

### Alertas

- N/A

## Como Começar

Siga as instruções abaixo para configurar e executar o projeto em seu ambiente local.

### Pré-requisitos

- [Node.js](https://nodejs.org/en/) (versão 18 ou superior)
- [yarn](https://yarnpkg.com)
- [Docker](https://www.docker.com/get-started) (para o banco de dados)

### Instalação

1. **Clone o repositório:**

   ```bash
   git clone https://hiae-inov-manaus@dev.azure.com/hiae-inov-manaus/VERACIS/_git/VERACIS_BACKEND
   cd VERACIS_BACKEND
   ```

2. **Instale as dependências:**

   ```bash
   yarn ou yarn install
   ```

3. **Configure o ambiente:**
   - Renomeie o arquivo `.env.example` para `.env`.
   - Preencha as variáveis de ambiente no arquivo `.env` com as suas configurações (banco de dados, chaves de segurança, etc.).

4. **Inicie o banco de dados com Docker:**

   ```bash
   docker-compose up -d ou docker compose up -d
   ```

5. **Execute as migrações do Prisma:**

   ```bash
   npx prisma migrate dev
   ```

### Executando a Aplicação

- **Modo de desenvolvimento:**

  ```bash
  yarn start:dev
  ```

  A aplicação estará disponível em `http://localhost:3000`.

- **Modo de produção:**

  ```bash
  yarn build
  yarn start:prod
  ```

### Gerando e Configurando Chaves RS256 para JWT

Estamos usando um tipo de algoritmo chamado RS256 para assinar nossos tokens JWT. Ele funciona com um par de chaves: a privada, que usamos para gerar os tokens de forma segura, e a pública, que pode ser compartilhada para que outros serviços verifiquem a autenticidade dos tokens. Dessa forma, garantimos que os dados não foram alterados e que os tokens são confiáveis, sem precisar expor nossa chave privada.

- **Gerar chave privada**

  ```bash
  openssl genpkey -algorithm RSA -out private.key -pkeyopt rsa_keygen_bits:2048
  ```

- **Gerar chave privada**

  ```bash
  openssl rsa -pubout -in private.key -out public.key
  ```

Para usar as chaves em variáveis de ambiente, é necessário transformá-las em Base64.

- **Conversão para a chave privada**

  ```bash
  base64 -w 0 private.key
  ```

- **Conversão para a chave privada**

  ```bash
  base64 -w 0 public.key
  ```

### Executando os Testes

- **Testes unitários**

  ```bash
  yarn test
  ```

- **Testes end-to-end (e2e):**

  ```bash
  yarn test:e2e
  ```

<!--END_SECTION:footer-->
