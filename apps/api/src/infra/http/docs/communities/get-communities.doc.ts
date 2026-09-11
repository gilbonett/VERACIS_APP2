import { applyDecorators, HttpStatus } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
} from "@nestjs/swagger";
import { errorSchema } from "../common/error-schema";

export const GetCommunitiesDoc = () =>
  applyDecorators(
    ApiOperation({
      summary: "Listar comunidades",
      description:
        "Retorna a lista de comunidades cadastradas. " +
        "Pode ser filtrada por bioma através do parâmetro `biomeId`.",
    }),

    ApiQuery({
      name: "biomeId",
      required: false,
      type: String,
      format: "uuid",
      description: "Filtra as comunidades pertencentes ao bioma informado.",
    }),

    ApiOkResponse({
      description: "Lista de comunidades retornada com sucesso.",
      schema: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                name: { type: "string" },
                description: {
                  type: "string",
                  nullable: true,
                },
                biomeId: { type: "string", format: "uuid" },
                createdAt: { type: "string", format: "date-time" },
              },
            },
          },
        },
      },
    }),

    ApiBadRequestResponse({
      description: "Parâmetros de query inválidos.",
      schema: errorSchema(
        HttpStatus.BAD_REQUEST,
        "biomeId must be a UUID",
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
