import { applyDecorators, HttpStatus } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { COOKIE_NAMES } from "../../cookies/cookie-options";
import { errorSchema } from "../common/error-schema";

export const GetAlertMetricsDoc = () =>
  applyDecorators(
    ApiCookieAuth(COOKIE_NAMES.SESSION_TOKEN),

    ApiOperation({
      summary: "Obter métricas de alertas",
      description:
        "Retorna as métricas de alertas da comunidade do usuário autenticado: " +
        "contagem de alertas por status, por categoria e por evento.",
    }),

    ApiOkResponse({
      description: "Métricas retornadas com sucesso.",
      schema: {
        type: "object",
        required: ["status", "categories", "events"],
        properties: {
          status: {
            type: "object",
            required: ["pending", "accepted", "closed", "rejected", "total"],
            properties: {
              pending: { type: "number", example: 4 },
              accepted: { type: "number", example: 10 },
              closed: { type: "number", example: 2 },
              rejected: { type: "number", example: 1 },
              total: { type: "number", example: 17 },
            },
          },
          categories: {
            type: "array",
            items: {
              type: "object",
              required: ["categoryId", "categoryName", "count"],
              properties: {
                categoryId: { type: "string", format: "uuid" },
                categoryName: { type: "string", example: "Saúde" },
                count: { type: "number", example: 5 },
              },
            },
          },
          events: {
            type: "array",
            items: {
              type: "object",
              required: ["eventId", "eventName", "count"],
              properties: {
                eventId: { type: "string", format: "uuid" },
                eventName: { type: "string", example: "Enchente" },
                count: { type: "number", example: 3 },
              },
            },
          },
        },
      },
    }),

    ApiBadRequestResponse({
      description: "Usuário autenticado não encontrado.",
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
