import { applyDecorators } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTooManyRequestsResponse,
} from "@nestjs/swagger";

export const AuthenticateUserDoc = () =>
  applyDecorators(
    ApiOperation({
      summary: "Login de usuário",
      description:
        "Realiza a autenticação de um usuário existente utilizando CPF e senha. " +
        "Em caso de sucesso, retorna um token JWT temporário que deve ser utilizado " +
        "para completar o processo de verificação MFA (Multi-Factor Authentication) " +
        "antes de obter acesso completo ao sistema.",
    }),
    ApiBody({
      description: "Credenciais de autenticação do usuário",
      schema: {
        type: "object",
        properties: {
          cpf: {
            type: "string",
            description: "CPF do usuário (apenas números)",
            pattern: "^[0-9]{11}$",
            example: "12345678900",
            minLength: 11,
            maxLength: 11,
          },
          password: {
            type: "string",
            description: "Senha do usuário",
            format: "password",
            example: "SenhaSegura@123",
            minLength: 6,
          },
        },
        required: ["cpf", "password"],
      },
    }),
    ApiOkResponse({
      description:
        "Autenticação bem-sucedida. Retorna um token JWT temporário para verificação MFA. " +
        "Este token deve ser utilizado no próximo passo para validar o código MFA.",
      schema: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
            description: "Indica se a operação foi bem-sucedida",
          },
          token: {
            type: "string",
            description:
              "Token JWT temporário para completar a autenticação MFA",
            example:
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
          },
          // expiresIn: {
          //   type: "number",
          //   description: "Tempo de expiração do token em segundos",
          //   example: 300,
          // },
          // requiresMfa: {
          //   type: "boolean",
          //   description: "Indica se é necessário completar a verificação MFA",
          //   example: true,
          // },
        },
        required: ["success", "token"],
      },
    }),
    ApiBadRequestResponse({
      description:
        "Requisição inválida. Pode ocorrer por dados mal formatados ou senha incorreta.",
      schema: {
        type: "object",
        properties: {
          status: {
            type: "number",
            example: 400,
          },
          message: {
            type: "string",
            example: "A senha informada está incorreta.",
            description: "Mensagem descritiva do erro",
          },
          error: {
            type: "string",
            example: "Bad Request",
          },
          timestamp: {
            type: "string",
            format: "date-time",
            example: "2024-01-15T10:30:00.000Z",
          },
          path: {
            type: "string",
            example: "/auth/login",
          },
        },
      },
    }),
    // ApiUnauthorizedResponse({
    //   description: "Credenciais inválidas ou usuário não autorizado.",
    //   schema: {
    //     type: "object",
    //     properties: {
    //       status: {
    //         type: "number",
    //         example: 401,
    //       },
    //       message: {
    //         type: "string",
    //         example: "CPF ou senha inválidos.",
    //       },
    //       error: {
    //         type: "string",
    //         example: "Unauthorized",
    //       },
    //       timestamp: {
    //         type: "string",
    //         format: "date-time",
    //         example: "2024-01-15T10:30:00.000Z",
    //       },
    //       path: {
    //         type: "string",
    //         example: "/auth/login",
    //       },
    //     },
    //   },
    // }),
    ApiNotFoundResponse({
      description:
        "Recurso não encontrado. Usuário ou credenciais não existem no sistema.",
      schema: {
        type: "object",
        properties: {
          status: {
            type: "number",
            example: 404,
          },
          message: {
            type: "string",
            example: "Usuário não encontrado.",
            description:
              "Possíveis valores: 'Usuário não encontrado.', 'Credenciais não encontradas.'",
          },
          error: {
            type: "string",
            example: "Not Found",
          },
          timestamp: {
            type: "string",
            format: "date-time",
            example: "2024-01-15T10:30:00.000Z",
          },
          path: {
            type: "string",
            example: "/auth/login",
          },
        },
      },
    }),
    ApiTooManyRequestsResponse({
      description:
        "Muitas tentativas de login. O usuário deve aguardar antes de tentar novamente.",
      schema: {
        type: "object",
        properties: {
          status: {
            type: "number",
            example: 429,
          },
          message: {
            type: "string",
            example:
              "Muitas tentativas de login. Tente novamente em 15 minutos.",
          },
          error: {
            type: "string",
            example: "Too Many Requests",
          },
          retryAfter: {
            type: "number",
            description: "Tempo em segundos para tentar novamente",
            example: 900,
          },
          timestamp: {
            type: "string",
            format: "date-time",
            example: "2024-01-15T10:30:00.000Z",
          },
          path: {
            type: "string",
            example: "/auth/login",
          },
        },
      },
    }),
    ApiInternalServerErrorResponse({
      description:
        "Erro interno do servidor. Ocorreu um erro inesperado ao processar a requisição.",
      schema: {
        type: "object",
        properties: {
          status: {
            type: "number",
            example: 500,
          },
          message: {
            type: "string",
            example: "Erro interno do servidor.",
          },
          error: {
            type: "string",
            example: "Internal Server Error",
          },
          timestamp: {
            type: "string",
            format: "date-time",
            example: "2024-01-15T10:30:00.000Z",
          },
          path: {
            type: "string",
            example: "/auth/login",
          },
        },
      },
    }),
  );
