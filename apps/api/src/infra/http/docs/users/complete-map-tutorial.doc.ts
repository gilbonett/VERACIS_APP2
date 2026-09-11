import { applyDecorators, HttpStatus } from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { COOKIE_NAMES } from "../../cookies/cookie-options";
import { errorSchema } from "../common/error-schema";

export const CompleteMapTutorialDoc = () =>
  applyDecorators(
    ApiCookieAuth(COOKIE_NAMES.SESSION_TOKEN),

    ApiOperation({
      summary: "Concluir tutorial do mapa",
      description:
        "Marca o tutorial do mapa como concluído para o usuário autenticado, " +
        "registrando a data de conclusão.",
    }),

    ApiOkResponse({
      description: "Tutorial do mapa concluído com sucesso.",
      schema: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          role: {
            type: "string",
            enum: ["MEMBER", "LEADER", "MANAGER", "ROOT"],
          },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          cpf: { type: "string" },
          phone: { type: "string" },
          lastedLat: { type: "number" },
          lastedLng: { type: "number" },
          birthDate: { type: "string", format: "date-time" },
          avatarUrl: { type: "string", nullable: true },
          mapTutorialCompletedAt: {
            type: "string",
            format: "date-time",
            nullable: true,
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          communities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                communityId: { type: "string", format: "uuid" },
                communityName: { type: "string" },
                biomeName: { type: "string" },
              },
            },
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

    ApiNotFoundResponse({
      description: "Usuário não encontrado.",
      schema: errorSchema(
        HttpStatus.NOT_FOUND,
        "Não encontramos uma conta com esses dados.",
        "Not Found",
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
