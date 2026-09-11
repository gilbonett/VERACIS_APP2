import { applyDecorators, HttpStatus } from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { COOKIE_NAMES } from "../../cookies/cookie-options";
import { AlertDetailsDto } from "../../dtos/alerts/alert-details.dto";
import { errorSchema } from "../common/error-schema";

export const GetAlertByIdDoc = () =>
  applyDecorators(
    ApiCookieAuth(COOKIE_NAMES.SESSION_TOKEN),

    ApiOperation({
      summary: "Buscar alerta por ID",
      description:
        "Retorna os detalhes de um alerta de ocorrência específico. " +
        "O campo `currentUserReaction` indica a reação do usuário autenticado no alerta.",
    }),

    ApiParam({
      name: "alertId",
      type: String,
      format: "uuid",
      description: "Identificador do alerta.",
    }),

    ApiOkResponse({
      description: "Alerta retornado com sucesso.",
      type: AlertDetailsDto,
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
