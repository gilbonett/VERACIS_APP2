import { applyDecorators, HttpStatus } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
} from "@nestjs/swagger";
import { errorSchema } from "../common/error-schema";

export const RegisterUserDoc = () =>
  applyDecorators(
    ApiOperation({
      summary: "Cadastrar usuário",
      description:
        "Cria uma nova conta de usuário. Valida se já existe uma conta com o mesmo " +
        "CPF ou e-mail antes de criar o registro. A senha é armazenada com hash e o " +
        "OTP é desabilitado por padrão para o novo usuário.",
    }),

    ApiBody({
      schema: {
        type: "object",
        required: [
          "name",
          "cpf",
          "birthDate",
          "lastedLat",
          "lastedLng",
          "phone",
          "email",
          "password",
          "termsId",
          "communityIds",
        ],
        properties: {
          name: { type: "string", example: "João da Silva" },
          cpf: { type: "string", example: "12345678900" },
          birthDate: {
            type: "string",
            description: "Formato DD/MM/YYYY.",
            example: "31/01/1990",
          },
          role: {
            type: "string",
            enum: ["MEMBER", "LEADER", "MANAGER", "ROOT"],
            default: "MEMBER",
          },
          lastedLat: { type: "number", example: -3.119 },
          lastedLng: { type: "number", example: -60.021 },
          phone: { type: "string", example: "92999999999" },
          email: { type: "string", format: "email", example: "joao@email.com" },
          password: { type: "string", format: "password" },
          termsId: { type: "string", format: "uuid" },
          communityIds: {
            type: "array",
            items: { type: "string", format: "uuid" },
          },
        },
      },
    }),

    ApiCreatedResponse({
      description: "Usuário criado com sucesso.",
      schema: {
        type: "object",
        properties: {
          message: { type: "string", example: "Created user successfuy" },
        },
      },
    }),

    ApiBadRequestResponse({
      description: "Já existe uma conta com este CPF ou e-mail.",
      schema: errorSchema(
        HttpStatus.BAD_REQUEST,
        "Já existe uma conta com este CPF ou e-mail.",
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
