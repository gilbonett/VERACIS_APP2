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

export const VerifyOtpDoc = () =>
  applyDecorators(
    ApiOperation({
      summary: "Verificar código OTP",
      description:
        "Valida o código OTP informado contra o desafio em andamento (cookie de desafio). " +
        "Se válido, cria a sessão do usuário, define o cookie de sessão, remove o cookie de " +
        "desafio e conclui o login.",
    }),

    ApiBody({
      schema: {
        type: "object",
        required: ["code"],
        properties: {
          code: { type: "string", minLength: 6, maxLength: 6, example: "123456" },
        },
      },
    }),

    ApiOkResponse({
      description: "Código válido. Login concluído e cookie de sessão definido.",
      schema: {
        type: "object",
        required: ["step"],
        properties: {
          step: { type: "string", enum: ["done"] },
        },
      },
    }),

    ApiBadRequestResponse({
      description:
        "Desafio não encontrado/expirado, código inválido ou número máximo de tentativas excedido.",
      schema: errorSchema(
        HttpStatus.BAD_REQUEST,
        "Código inválido ou expirado. Solicite um novo código.",
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
