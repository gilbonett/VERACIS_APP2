import { applyDecorators, HttpStatus } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { COOKIE_NAMES } from "../../cookies/cookie-options";
import { errorSchema } from "../common/error-schema";

export const GetEventsByCategoryIdDoc = () =>
  applyDecorators(
    ApiCookieAuth(COOKIE_NAMES.SESSION_TOKEN),

    ApiOperation({
      summary: "Listar eventos por categoria",
      description:
        "Retorna a lista de eventos vinculados à categoria informada. " +
        "Retorna uma lista vazia caso não haja eventos para a categoria.",
    }),

    ApiParam({
      name: "categoryId",
      required: true,
      format: "uuid",
      description: "Identificador da categoria de eventos.",
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

    ApiBadRequestResponse({
      description: "Identificador de categoria inválido.",
      schema: errorSchema(
        HttpStatus.BAD_REQUEST,
        "Informe um ID de categoria válido",
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
