import { applyDecorators, HttpStatus } from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiBody,
} from "@nestjs/swagger";
import { COOKIE_NAMES } from "../../cookies/cookie-options";
import { errorSchema } from "../common/error-schema";

export const CreateAlertAttachmentDoc = () =>
  applyDecorators(
    ApiCookieAuth(COOKIE_NAMES.SESSION_TOKEN),

    ApiOperation({
      summary: "Vincular anexo a um alerta",
      description:
        "Vincula um anexo (arquivo já enviado) a um alerta de ocorrência, " +
        "associando o `attachmentId` informado ao `alertId` do alerta.",
    }),

    ApiBody({
      schema: {
        type: "object",
        required: ["attachmentId", "alertId"],
        properties: {
          attachmentId: {
            type: "string",
            format: "uuid",
            description: "Identificador do anexo já enviado.",
          },
          alertId: {
            type: "string",
            format: "uuid",
            description: "Identificador do alerta ao qual o anexo será vinculado.",
          },
        },
      },
    }),

    ApiCreatedResponse({
      description: "Anexo vinculado ao alerta com sucesso.",
      schema: {
        type: "object",
        required: ["message"],
        properties: {
          message: {
            type: "string",
            example: "Attachment created successfully",
          },
        },
      },
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
