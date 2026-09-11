import { applyDecorators, HttpStatus } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
} from "@nestjs/swagger";
import { errorSchema } from "../common/error-schema";

export const SignInDoc = () =>
  applyDecorators(
    ApiOperation({
      summary: "Login (CPF e senha)",
      description:
        "Autentica o usuário com CPF e senha. Se o usuário não tiver OTP habilitado, " +
        "encerra o login e define o cookie de sessão (`step: DONE`). " +
        "Se o usuário tiver OTP habilitado, cria um desafio de verificação, define o cookie " +
        "de desafio e retorna `step: PENDING_EMAIL` com o e-mail mascarado para o próximo passo.",
    }),

    ApiBody({
      schema: {
        type: "object",
        required: ["cpf", "password"],
        properties: {
          cpf: { type: "string", example: "12345678900" },
          password: { type: "string", minLength: 1, example: "senha-secreta" },
        },
      },
    }),

    ApiOkResponse({
      description:
        "Login processado. O corpo retornado depende de o usuário ter OTP habilitado.",
      schema: {
        oneOf: [
          {
            type: "object",
            description: "Login concluído. Cookie de sessão definido.",
            required: ["step"],
            properties: {
              step: { type: "string", enum: ["DONE"] },
            },
          },
          {
            type: "object",
            description:
              "Credenciais válidas, mas é necessário verificar o código OTP. Cookie de desafio definido.",
            required: ["step", "emailMasked"],
            properties: {
              step: { type: "string", enum: ["PENDING_EMAIL"] },
              emailMasked: { type: "string", example: "jo***@example.com" },
            },
          },
        ],
      },
    }),

    ApiBadRequestResponse({
      description: "CPF inválido ou credenciais incorretas.",
      schema: errorSchema(
        HttpStatus.BAD_REQUEST,
        "CPF ou senha incorretos. Verifique os dados e tente novamente.",
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
