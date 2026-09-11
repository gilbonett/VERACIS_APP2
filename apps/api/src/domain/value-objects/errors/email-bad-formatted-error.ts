import { DomainError } from '@/core/errors/domain-error'

export class EmailBadFormattedError extends Error implements DomainError {
  constructor(email: string) {
    super('O e-mail informado não é válido.')
    this.name = 'EmailBadFormatted'
  }
}
