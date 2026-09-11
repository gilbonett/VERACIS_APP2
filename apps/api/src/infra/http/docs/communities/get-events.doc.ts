import { applyDecorators, HttpStatus } from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { COOKIE_NAMES } from "../../cookies/cookie-options";
import { errorSchema } from "../common/error-schema";

export const GetEventsDoc = () =>
  applyDecorators(
    ApiCookieAuth(COOKIE_NAMES.SESSION_TOKEN),

    ApiOperation({
      summary: "Listar eventos",
      description: "Retorna a lista de todos os eventos cadastrados.",
    }),

    ApiOkResponse({
      description: "Lista de eventos retornada com sucesso.",
      schema: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            description: { type: "string", nullable: true },
            icon: { type: "string", nullable: true },
            categoryId: { type: "string", format: "uuid" },
            slug: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
      },
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
