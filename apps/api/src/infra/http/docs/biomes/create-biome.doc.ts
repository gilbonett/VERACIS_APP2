import { applyDecorators, HttpStatus } from "@nestjs/common";
import {
  ApiBody,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
} from "@nestjs/swagger";
import { errorSchema } from "../common/error-schema";

export const CreateBiomeDoc = () =>
  applyDecorators(
    ApiOperation({
      summary: "Criar bioma",
      description: "Cadastra um novo bioma a partir do nome e descrição informados.",
    }),

    ApiBody({
      schema: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", description: "Nome do bioma." },
          description: {
            type: "string",
            nullable: true,
            description: "Descrição do bioma.",
          },
        },
      },
    }),

    ApiCreatedResponse({
      description: "Bioma criado com sucesso.",
      schema: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          slug: { type: "string" },
          description: { type: "string", nullable: true },
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
