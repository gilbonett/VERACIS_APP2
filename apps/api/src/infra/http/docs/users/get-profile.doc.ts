import { applyDecorators, HttpStatus } from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { COOKIE_NAMES } from "../../cookies/cookie-options";
import { errorSchema } from "../common/error-schema";

export const GetProfileDoc = () =>
  applyDecorators(
    ApiCookieAuth(COOKIE_NAMES.SESSION_TOKEN),

    ApiOperation({
      summary: "Obter perfil do usuário autenticado",
      description:
        "Retorna os dados do perfil do usuário autenticado, incluindo as comunidades " +
        "às quais pertence. Invalida o cache de perfil antes de buscar os dados atualizados.",
    }),

    ApiOkResponse({
      description: "Perfil retornado com sucesso.",
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

    // Nota: quando o usuário não é encontrado, o handler lança um Error genérico,
    // que é tratado pelo filtro global de exceções como 500.
    ApiInternalServerErrorResponse({
      description: "Erro interno do servidor (inclui o caso de usuário não encontrado).",
      schema: errorSchema(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "Não encontramos uma conta com esses dados.",
        "Internal Server Error",
      ),
    }),
  );
