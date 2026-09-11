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
import { errorSchema } from "../common/error-schema";

export const CreateRiskDoc = () =>
  applyDecorators(
    ApiCookieAuth(COOKIE_NAMES.SESSION_TOKEN),

    ApiOperation({
      summary: "Criar risco",
      description:
        "Cadastra um novo risco. O nome é convertido em slug e deve ser único — " +
        "se já existir um risco com o mesmo slug, a criação é rejeitada.",
    }),

    ApiBody({
      schema: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", example: "Enchente" },
          description: {
            type: "string",
            nullable: true,
            example: "Risco de alagamento em áreas ribeirinhas.",
          },
        },
      },
    }),

    ApiCreatedResponse({
      description: "Risco criado com sucesso.",
      schema: {
        type: "object",
        required: ["message"],
        properties: {
          message: {
            type: "string",
            example: "Risk created successfully",
          },
        },
      },
    }),

    ApiBadRequestResponse({
      description: "Já existe um risco com o mesmo nome/slug.",
      schema: errorSchema(
        HttpStatus.BAD_REQUEST,
        "Já existe um risco com esse nome.",
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
