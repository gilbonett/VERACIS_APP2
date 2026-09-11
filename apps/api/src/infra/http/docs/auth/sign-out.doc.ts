import { applyDecorators, HttpStatus } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";
import { COOKIE_NAMES } from "../../cookies/cookie-options";
import { errorSchema } from "../common/error-schema";

export const SignOutDoc = () =>
  applyDecorators(
    ApiCookieAuth(COOKIE_NAMES.SESSION_TOKEN),

    ApiOperation({
      summary: "Logout",
      description:
        "Encerra a sessão do usuário autenticado. Remove a sessão correspondente ao " +
        "cookie de sessão informado e limpa o cookie no navegador.",
    }),

    ApiResponse({
      status: HttpStatus.NO_CONTENT,
      description: "Sessão encerrada com sucesso.",
    }),

    ApiBadRequestResponse({
      description: "Sessão não encontrada ou já expirada.",
      schema: errorSchema(
        HttpStatus.BAD_REQUEST,
        "Sua sessão expirou. Faça login novamente.",
        "Bad Request",
      ),
    }),

    ApiInternalServerErrorResponse({
      description: "Erro interno do servidor.",
      schema: errorSchema(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "Erro interno do servidor",
        "Internal Server Error",
      ),
    }),
  );
