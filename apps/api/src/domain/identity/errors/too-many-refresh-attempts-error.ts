import { DomainError } from '@/core/errors/domain-error'

export class TooManyRefreshAttemptsError extends Error implements DomainError {
  constructor() {
    super('Muitas tentativas de refresh, tente novamente mais tarde.')
    this.name = 'TooManyRefreshAttemptsError'
  }
}
