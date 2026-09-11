import { applyDecorators } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger'

export const AuthRegisterDoc = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Registrar novo usuário',
      description:
        'Realiza o cadastro de um novo usuário na Plataforma com suas informações pessoais e ' +
        'vinculação a comunidades específicas',
    }),
    ApiBody({
      description: 'Dados para cadastro do novo usuário',
      schema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Nome completo do usuário',
            example: 'João Silva',
          },
          cpf: {
            type: 'string',
            description: 'CPF do usuário (11 dígitos)',
            example: '12345678901',
            minLength: 11,
            maxLength: 11,
          },
          birthDate: {
            type: 'string',
            format: 'date',
            description: 'Data de nascimento do usuário',
            example: '1990-05-15',
          },
          phone: {
            type: 'string',
            description: 'Telefone do usuário',
            example: '11987654321',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'E-mail principal do usuário',
            example: 'joao.silva@exemplo.com',
          },
          emailRecovery: {
            type: 'string',
            format: 'email',
            description: 'E-mail alternativo para recuperação de conta',
            example: 'joao.recuperacao@exemplo.com',
            nullable: true,
          },
          password: {
            type: 'string',
            description: 'Senha do usuário (mínimo 6 caracteres)',
            example: 'senhaSegura123',
            minLength: 6,
          },
          communityIds: {
            type: 'array',
            description: 'IDs das comunidades que o usuário fará parte',
            items: {
              type: 'string',
              example: 'uuid-da-comunidade',
            },
            example: ['550e8400-e29b-41d4-a716-446655440000'],
          },
        },
        required: [
          'name',
          'cpf',
          'birthDate',
          'phone',
          'email',
          'password',
          'communityIds',
        ],
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Usuário cadastrado com sucesso',
      schema: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'uuid-do-usuario' },
              name: { type: 'string', example: 'João Silva' },
              email: { type: 'string', example: 'joao.silva@exemplo.com' },
              cpf: { type: 'string', example: '12345678901' },
              createdAt: {
                type: 'string',
                format: 'date-time',
                example: '2024-01-15T10:30:00Z',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                example: '2024-01-15T10:30:00Z',
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Dados de entrada inválidos ou usuário já existe',
      schema: {
        type: 'object',
        properties: {
          message: {
            oneOf: [
              {
                type: 'string',
                example: 'CPF já cadastrado no sistema',
              },
              {
                type: 'string',
                example: 'E-mail já cadastrado no sistema',
              },
              {
                type: 'string',
                example: 'Telefone já cadastrado no sistema',
              },
            ],
          },
          statusCode: { type: 'number', example: 400 },
        },
      },
      examples: {
        cpfDuplicado: {
          summary: 'CPF já cadastrado',
          value: {
            message: 'CPF já cadastrado no sistema',
            statusCode: 400,
          },
        },
        emailDuplicado: {
          summary: 'E-mail já cadastrado',
          value: {
            message: 'E-mail já cadastrado no sistema',
            statusCode: 400,
          },
        },
        telefoneDuplicado: {
          summary: 'Telefone já cadastrado',
          value: {
            message: 'Telefone já cadastrado no sistema',
            statusCode: 400,
          },
        },
      },
    }),
    ApiResponse({
      status: 422,
      description: 'Erro de validação dos dados',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'array',
            items: { type: 'string' },
            example: [
              'CPF deve ter 11 dígitos',
              'E-mail inválido',
              'Senha deve ter pelo menos 6 caracteres',
            ],
          },
          statusCode: { type: 'number', example: 422 },
        },
      },
    }),
  )
