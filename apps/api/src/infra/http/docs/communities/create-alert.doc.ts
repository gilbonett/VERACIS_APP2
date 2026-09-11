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
import { CreateAlertDto } from "../../dtos/alerts/alert.dto";
import { errorSchema } from "../common/error-schema";

export const CreateAlertDoc = () =>
  applyDecorators(
    ApiCookieAuth(COOKIE_NAMES.SESSION_TOKEN),

    ApiOperation({
      summary: "Criar alerta",
      description:
        "Registra um novo alerta de ocorrência em uma comunidade. " +
        "O alerta é criado com status PENDING e vinculado aos eventos informados.",
    }),

    // ✅ Referencia o DTO diretamente — o nestjs-zod gera o schema automaticamente
    ApiBody({ type: CreateAlertDto }),

    ApiCreatedResponse({
      description: "Alerta criado com sucesso.",
      schema: {
        type: "object",
        required: ["id"],
        properties: {
          id: {
            type: "string",
            format: "uuid",
            description: "Identificador do alerta criado.",
          },
        },
      },
    }),

    ApiBadRequestResponse({
      description: "Dados inválidos.",
      schema: errorSchema(
        HttpStatus.BAD_REQUEST,
        "Latitude deve ser no máximo 90",
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
