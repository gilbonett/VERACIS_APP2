import { applyDecorators, HttpStatus } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiQuery,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { COOKIE_NAMES } from "../../cookies/cookie-options";
import { errorSchema } from "../common/error-schema";

export const UploadAndCreateAttachmentDoc = () =>
  applyDecorators(
    ApiCookieAuth(COOKIE_NAMES.SESSION_TOKEN),

    ApiOperation({
      summary: "Enviar anexo",
      description:
        "Faz upload de um arquivo (máx. 10MB) e cria um anexo vinculado ao escopo informado (`USER` ou `ALERT`). " +
        "Tipos de arquivo aceitos: JPEG, PNG, WEBP, GIF e PDF.",
    }),

    ApiConsumes("multipart/form-data"),

    ApiQuery({
      name: "scope",
      enum: ["USER", "ALERT"],
      description: "Escopo ao qual o anexo pertence.",
    }),

    ApiBody({
      schema: {
        type: "object",
        required: ["file"],
        properties: {
          file: {
            type: "string",
            format: "binary",
            description: "Arquivo a ser enviado (campo multipart `file`).",
          },
        },
      },
    }),

    ApiCreatedResponse({
      description: "Anexo criado com sucesso.",
      schema: {
        type: "object",
        required: ["attachmentId", "url"],
        properties: {
          attachmentId: {
            type: "string",
            format: "uuid",
            description: "Identificador do anexo criado.",
          },
          url: {
            type: "string",
            description: "URL pública do arquivo enviado.",
          },
        },
      },
    }),

    ApiBadRequestResponse({
      description:
        "Arquivo não enviado ou tipo de arquivo não permitido.",
      schema: errorSchema(
        HttpStatus.BAD_REQUEST,
        'O arquivo do tipo "text/plain" não é permitido.',
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
