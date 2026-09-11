import { DomainError } from '@/core/errors/domain-error'

export class CpfBadValidError extends Error implements DomainError {
  constructor(cpf: string) {
    super('O CPF informado não é válido.')
    this.name = 'EmailBadValid'
  }
}
