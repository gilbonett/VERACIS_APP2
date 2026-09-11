import { applyDecorators, HttpStatus } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
} from "@nestjs/swagger";
import { errorSchema } from "../common/error-schema";

export const ValidateResetTokenDoc = () =>
  applyDecorators(
    ApiOperation({
      summary: "Validar token de redefinição de senha",
      description:
        "Verifica se o token de redefinição de senha ainda é válido (não expirado e não " +
        "utilizado). Chamado pelo frontend antes de exibir o formulário de nova senha.",
    }),

    ApiBody({
      schema: {
        type: "object",
        required: ["token"],
        properties: {
          token: { type: "string", example: "a1b2c3d4e5f6" },
        },
      },
    }),

    ApiOkResponse({
      description: "Token válido.",
      schema: {
        type: "object",
        required: ["valid"],
        properties: {
          valid: { type: "boolean", example: true },
        },
      },
    }),

    ApiBadRequestResponse({
      description: "Token inválido, expirado ou já utilizado.",
      schema: errorSchema(
        HttpStatus.BAD_REQUEST,
        "Este link expirou ou já foi usado. Solicite um novo link de redefinição.",
        "Bad Request",
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
