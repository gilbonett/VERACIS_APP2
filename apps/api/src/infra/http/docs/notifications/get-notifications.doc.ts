import { applyDecorators, HttpStatus } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { COOKIE_NAMES } from "../../cookies/cookie-options";
import { errorSchema } from "../common/error-schema";

export const GetNotificationsDoc = () =>
  applyDecorators(
    ApiCookieAuth(COOKIE_NAMES.SESSION_TOKEN),

    ApiOperation({
      summary: "Listar notificações",
      description:
        "Retorna as notificações do usuário autenticado, paginadas por cursor. " +
        "O campo `nextCursor` deve ser usado para buscar a próxima página.",
    }),

    ApiQuery({
      name: "cursor",
      required: false,
      type: String,
      description: "Cursor da última notificação da página anterior.",
    }),
    ApiQuery({
      name: "limit",
      required: false,
      type: Number,
      description: "Quantidade máxima de notificações retornadas (padrão: 10).",
    }),

    ApiOkResponse({
      description: "Notificações retornadas com sucesso.",
      schema: {
        type: "object",
        required: ["count", "nextCursor", "items"],
        properties: {
          count: {
            type: "number",
            description: "Total de notificações do usuário.",
          },
          nextCursor: {
            type: "string",
            nullable: true,
            description: "Cursor para buscar a próxima página, ou null se não houver mais.",
          },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                scope: { type: "string", enum: ["ALERT", "USER"] },
                title: { type: "string" },
                content: { type: "string" },
                readAt: {
                  type: "string",
                  format: "date-time",
                  nullable: true,
                },
                alertId: { type: "string", format: "uuid", nullable: true },
                authorId: { type: "string", format: "uuid" },
                recipientId: { type: "string", format: "uuid" },
                createdAt: { type: "string", format: "date-time" },
              },
            },
          },
        },
      },
    }),

    ApiBadRequestResponse({
      description: "Parâmetros de query inválidos.",
      schema: errorSchema(
        HttpStatus.BAD_REQUEST,
        "limit must be a number",
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
