import { applyDecorators } from "@nestjs/common";
import { ApiCookieAuth, ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { COOKIE_NAMES } from "../../cookies/cookie-options";

export const SteamNotificationsDoc = () =>
  applyDecorators(
    ApiCookieAuth(COOKIE_NAMES.SESSION_TOKEN),

    ApiOperation({
      summary: "Stream de notificações em tempo real",
      description:
        "Abre uma conexão Server-Sent Events (`text/event-stream`) que emite um evento " +
        "a cada nova notificação recebida pelo usuário autenticado. A conexão permanece " +
        "aberta até ser encerrada pelo cliente.",
    }),

    ApiOkResponse({
      description:
        "Conexão estabelecida. Cada evento emitido segue o formato abaixo.",
      schema: {
        type: "object",
        properties: {
          type: { type: "string", example: "notifications" },
          data: {
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
    }),
  );
