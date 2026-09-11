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
import { AlertDetailsDto } from "../../dtos/alerts/alert-details.dto";
import { errorSchema } from "../common/error-schema";

export const GetAlertsDoc = () =>
  applyDecorators(
    ApiCookieAuth(COOKIE_NAMES.SESSION_TOKEN),

    ApiOperation({
      summary: "Listar alertas",
      description:
        "Retorna a lista de alertas de ocorrência de uma comunidade. " +
        "Por padrão traz alertas com status PENDING e ACCEPTED. " +
        "O campo `currentUserReaction` indica a reação do usuário autenticado em cada alerta.",
    }),

    ApiOkResponse({
      description: "Lista de alertas retornada com sucesso.",
      type: AlertDetailsDto,
      isArray: true,
    }),

    ApiBadRequestResponse({
      description: "Parâmetros de query inválidos.",
      schema: errorSchema(
        HttpStatus.BAD_REQUEST,
        "communityId must be a UUID",
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
