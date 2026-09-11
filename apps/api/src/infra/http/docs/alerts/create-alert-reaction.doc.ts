import { applyDecorators, HttpStatus } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { COOKIE_NAMES } from "../../cookies/cookie-options";
import { AlertReactionDto } from "../../dtos/alerts/alert-reaction.dto";
import { errorSchema } from "../common/error-schema";

export const CreateAlertReactionDoc = () =>
  applyDecorators(
    ApiCookieAuth(COOKIE_NAMES.SESSION_TOKEN),

    ApiOperation({
      summary: "Reagir a um alerta",
      description:
        "Registra uma reação (LIKE ou DISLIKE) de confirmação de um alerta. " +
        "O alerta deve estar com status PENDING e o usuário não pode ter reagido antes. " +
        "Dependendo do papel do usuário e da quantidade de confirmações, o alerta pode ser aceito automaticamente.",
    }),

    ApiBody({ type: AlertReactionDto }),

    ApiCreatedResponse({
      description: "Reação registrada com sucesso.",
      schema: {
        type: "object",
        required: ["message"],
        properties: {
          message: {
            type: "string",
            example: "Reaction created successfully",
          },
        },
      },
    }),

    ApiBadRequestResponse({
      description:
        "Alerta não encontrado, não está mais aberto para confirmações ou o usuário já reagiu a este alerta.",
      schema: errorSchema(
        HttpStatus.BAD_REQUEST,
        "Você já confirmou este alerta.",
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
