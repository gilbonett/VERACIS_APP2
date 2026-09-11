import { applyDecorators, HttpStatus } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiInternalServerErrorResponse,
  ApiNoContentResponse,
  ApiOperation,
  ApiParam,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { COOKIE_NAMES } from "../../cookies/cookie-options";
import { errorSchema } from "../common/error-schema";

export const ReadNotificationDoc = () =>
  applyDecorators(
    ApiCookieAuth(COOKIE_NAMES.SESSION_TOKEN),

    ApiOperation({
      summary: "Marcar notificação como lida",
      description:
        "Marca a notificação informada como lida pelo usuário autenticado.",
    }),

    ApiParam({
      name: "notificationId",
      type: String,
      format: "uuid",
      description: "Identificador da notificação.",
    }),

    ApiNoContentResponse({
      description: "Notificação marcada como lida com sucesso.",
    }),

    ApiBadRequestResponse({
      description: "Notificação não encontrada.",
      schema: errorSchema(
        HttpStatus.BAD_REQUEST,
        "Não encontramos esta notificação.",
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
