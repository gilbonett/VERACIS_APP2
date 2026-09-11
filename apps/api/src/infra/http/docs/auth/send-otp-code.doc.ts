import { applyDecorators, HttpStatus } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { errorSchema } from "../common/error-schema";

export const SendOtpCodeDoc = () =>
  applyDecorators(
    ApiOperation({
      summary: "Enviar código OTP",
      description:
        "Gera e envia um código de verificação (OTP) para o e-mail informado, vinculado ao " +
        "desafio de login em andamento (cookie de desafio). Deve ser chamado após o " +
        "`step: PENDING_EMAIL` retornado pelo login.",
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
      description: "Código OTP enviado com sucesso.",
      schema: {
        type: "object",
        required: ["expiresAt"],
        properties: {
          expiresAt: { type: "string", format: "date-time" },
        },
      },
    }),

    ApiBadRequestResponse({
      description:
        "Desafio de verificação não encontrado, expirado ou em estado inválido.",
      schema: errorSchema(
        HttpStatus.BAD_REQUEST,
        "Seu código de verificação expirou. Solicite um novo.",
        "Bad Request",
      ),
    }),

    ApiUnauthorizedResponse({
      description: "Cookie de desafio (challenge token) ausente ou inválido.",
      schema: errorSchema(HttpStatus.UNAUTHORIZED, "Unauthorized", "Unauthorized"),
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
