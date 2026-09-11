import { applyDecorators, HttpStatus } from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiHeader,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { COOKIE_NAMES } from "../cookies/cookie-options";

export const LogoutUserDoc = () =>
  applyDecorators(
    ApiOperation({
      summary: "Logout do usuário",
      description:
        "Realiza o logout do usuário autenticado, invalidando a sessão atual no servidor " +
        "e removendo os cookies de autenticação. Esta operação requer que o usuário esteja " +
        "previamente autenticado com um token válido no cookie. Após o logout, o token não " +
        "poderá mais ser utilizado para acessar rotas protegidas.",
    }),
    ApiCookieAuth(COOKIE_NAMES.SESSION_TOKEN),
    ApiHeader({
      name: "Cookie",
      description: `Cookie de autenticação contendo o token JWT no formato: ${COOKIE_NAMES.SESSION_TOKEN}=<token>`,
      required: true,
      schema: {
        type: "string",
        example: `${COOKIE_NAMES.SESSION_TOKEN}=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`,
      },
    }),
    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description:
        "Logout realizado com sucesso. A sessão foi invalidada no servidor e os cookies " +
        "de autenticação foram removidos. O cliente não receberá corpo na resposta (204 No Content). " +
        "O cookie será removido através do header Set-Cookie com Max-Age=0.",
      headers: {
        "Set-Cookie": {
          description: "Header que remove o cookie de autenticação",
          schema: {
            type: "string",
            example: `${COOKIE_NAMES.SESSION_TOKEN}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
          },
        },
      },
      schema: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          message: {
            type: "string",
            example: "Logout realizado com sucesso",
          },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description:
        "Não autorizado. O token de autenticação está ausente, inválido, expirado ou foi revogado. " +
        "Verifique se o cookie está sendo enviado corretamente no header da requisição.",
      schema: {
        type: "object",
        properties: {
          status: {
            type: "number",
            example: 401,
          },
          message: {
            type: "string",
            example: "Token inválido ou expirado.",
            description: "Mensagem descritiva do erro de autenticação",
          },
          error: {
            type: "string",
            example: "Unauthorized",
          },
          timestamp: {
            type: "string",
            format: "date-time",
            example: "2024-01-15T10:30:00.000Z",
            description: "Data e hora em que o erro ocorreu",
          },
          path: {
            type: "string",
            example: "/auth/logout",
            description: "Caminho da requisição que gerou o erro",
          },
        },
        required: ["status", "message", "error", "timestamp", "path"],
      },
    }),
    ApiNotFoundResponse({
      description:
        "Sessão não encontrada. A sessão do usuário não existe no servidor ou já foi " +
        "invalidada anteriormente. Isso pode ocorrer se o logout já foi realizado ou se " +
        "a sessão expirou automaticamente.",
      schema: {
        type: "object",
        properties: {
          status: {
            type: "number",
            example: 404,
          },
          message: {
            type: "string",
            example: "Sessão não encontrada.",
            description: "Indica que a sessão não existe ou já foi encerrada",
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
            example: "/auth/logout",
          },
        },
        required: ["status", "message", "error", "timestamp", "path"],
      },
    }),
    ApiInternalServerErrorResponse({
      description:
        "Erro interno do servidor. Ocorreu um erro inesperado ao processar a requisição de logout. " +
        "Apesar do erro, é recomendado que o cliente trate a sessão como encerrada e remova " +
        "os dados locais de autenticação.",
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
            description: "Mensagem genérica de erro do servidor",
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
            example: "/auth/logout",
          },
        },
        required: ["status", "message", "error", "timestamp", "path"],
      },
    }),
  );
