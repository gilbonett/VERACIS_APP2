import { applyDecorators, HttpStatus } from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { COOKIE_NAMES } from "../../cookies/cookie-options";
import { BodyAlertCommentDto } from "../../dtos/alerts/alert-comment.dto";
import { errorSchema } from "../common/error-schema";

export const CreateAlertCommentDoc = () =>
  applyDecorators(
    ApiCookieAuth(COOKIE_NAMES.SESSION_TOKEN),

    ApiOperation({
      summary: "Comentar em um alerta",
      description:
        "Adiciona um comentário a um alerta de ocorrência. " +
        "O alerta deve existir e estar visível para o usuário autenticado.",
    }),

    ApiBody({ type: BodyAlertCommentDto }),

    ApiCreatedResponse({
      description: "Comentário criado com sucesso.",
    }),

    ApiNotFoundResponse({
      description: "Alerta não encontrado ou não visível para o usuário.",
      schema: errorSchema(
        HttpStatus.NOT_FOUND,
        "Não encontramos este alerta.",
        "Not Found",
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
