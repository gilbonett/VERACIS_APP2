import { applyDecorators, HttpStatus } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCookieAuth,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { COOKIE_NAMES } from "../../cookies/cookie-options";
import { errorSchema } from "../common/error-schema";

export const UpdateProfileDoc = () =>
  applyDecorators(
    ApiCookieAuth(COOKIE_NAMES.SESSION_TOKEN),

    ApiOperation({
      summary: "Atualizar perfil do usuário autenticado",
      description:
        "Atualiza a URL do avatar do usuário autenticado. Se o e-mail informado " +
        "já pertencer a outro usuário, a atualização é rejeitada.",
    }),

    ApiBody({
      schema: {
        type: "object",
        properties: {
          avatarUrl: {
            type: "string",
            format: "url",
            nullable: true,
          },
        },
      },
    }),

    ApiOkResponse({
      description: "Perfil atualizado com sucesso.",
      schema: {
        type: "object",
        properties: {
          message: { type: "string", example: "Profile updated successfully" },
        },
      },
    }),

    ApiBadRequestResponse({
      description:
        "Usuário não encontrado ou já existe uma conta com o e-mail informado.",
      schema: errorSchema(
        HttpStatus.BAD_REQUEST,
        "Não encontramos uma conta com esses dados.",
        "Bad Request",
      ),
    }),

    ApiUnauthorizedResponse({
      description: "Não autenticado.",
      schema: errorSchema(
        HttpStatus.UNAUTHORIZED,
        "Token inválido ou expirado.",
        "Unauthorized",
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
