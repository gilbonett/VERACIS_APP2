import { DomainError } from '@/core/errors/domain-error'

export class FederatedAssuranceInsufficientError
  extends Error
  implements DomainError
{
  constructor() {
    super('Autenticação multifator não habilitada no provedor.')
  }
}
