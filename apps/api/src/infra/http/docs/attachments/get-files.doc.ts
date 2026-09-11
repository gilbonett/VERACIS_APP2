import { applyDecorators, HttpStatus } from "@nestjs/common";
import {
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
} from "@nestjs/swagger";
import { errorSchema } from "../common/error-schema";

export const GetFilesDoc = () =>
  applyDecorators(
    ApiOperation({
      summary: "Servir arquivo",
      description:
        "Retorna o conteúdo binário de um arquivo previamente enviado (ex.: avatar de usuário, imagem de alerta). " +
        "Rota pública, sem necessidade de autenticação. O nome do arquivo é validado para impedir path traversal.",
    }),

    ApiParam({
      name: "fileName",
      description: "Caminho/nome do arquivo armazenado, ex.: `users/<id>.png`.",
      example: "users/3fa85f64-5717-4562-b3fc-2c963f66afa6.png",
    }),

    ApiProduces("application/octet-stream", "image/*", "application/pdf"),

    ApiOkResponse({
      description: "Arquivo retornado com sucesso como stream binário.",
    }),

    ApiNotFoundResponse({
      description: "Arquivo não encontrado ou nome de arquivo inválido.",
      schema: errorSchema(
        HttpStatus.NOT_FOUND,
        "Arquivo não encontrado.",
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
