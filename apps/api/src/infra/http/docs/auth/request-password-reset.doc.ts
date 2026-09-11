import { applyDecorators, HttpStatus } from "@nestjs/common";
import {
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
} from "@nestjs/swagger";
import { errorSchema } from "../common/error-schema";

export const RequestPasswordResetDoc = () =>
  applyDecorators(
    ApiOperation({
      summary: "Solicitar redefinição de senha",
      description:
        "Envia um link de redefinição de senha para o e-mail informado, caso exista um " +
        "usuário associado. Por segurança, a resposta é sempre a mesma independentemente " +
        "de o e-mail existir ou não.",
    }),

    ApiBody({
      schema: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email", example: "usuario@example.com" },
        },
      },
    }),

    ApiOkResponse({
      description: "Solicitação processada.",
      schema: {
        type: "object",
        required: ["message"],
        properties: {
          message: {
            type: "string",
            example: "If the email exists, you will receive a link shortly.",
          },
        },
      },
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
