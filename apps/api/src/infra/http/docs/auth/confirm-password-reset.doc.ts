import { applyDecorators, HttpStatus } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
} from "@nestjs/swagger";
import { errorSchema } from "../common/error-schema";

export const ConfirmPasswordResetDoc = () =>
  applyDecorators(
    ApiOperation({
      summary: "Confirmar redefinição de senha",
      description:
        "Redefine a senha do usuário a partir de um token de redefinição válido. " +
        "Ao concluir, todas as sessões ativas do usuário são invalidadas.",
    }),

    ApiBody({
      schema: {
        type: "object",
        required: ["token", "newPassword"],
        properties: {
          token: { type: "string", example: "a1b2c3d4e5f6" },
          newPassword: { type: "string", minLength: 8, example: "nova-senha-forte" },
        },
      },
    }),

    ApiOkResponse({
      description: "Senha redefinida com sucesso.",
      schema: {
        type: "object",
        required: ["message"],
        properties: {
          message: { type: "string", example: "Password reset successfully." },
        },
      },
    }),

    ApiBadRequestResponse({
      description: "Token inválido/expirado ou nova senha inválida.",
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
