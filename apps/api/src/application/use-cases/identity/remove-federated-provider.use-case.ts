import { Either, left, right } from '@/core/either'
import { FederatedProviderNotFoundError } from '@/domain/identity/errors/federated-provider-not-found-error'
import { ProviderHasLinkedIdentitiesError } from '@/domain/identity/errors/provider-has-linked-identities-error'
import { AccountRepository } from '@/domain/identity/repositories/account-repository'
import { FederatedProviderConfigRepository } from '@/domain/identity/repositories/federated-provider-config-repository'
import { Injectable } from '@nestjs/common'

interface RemoveFederatedProviderUseCaseRequest {
  id: string
}

type RemoveFederatedProviderUseCaseResponse = Either<
  FederatedProviderNotFoundError | ProviderHasLinkedIdentitiesError,
  void
>

@Injectable()
export class RemoveFederatedProviderUseCase {
  constructor(
    private federatedProviderConfigRepository: FederatedProviderConfigRepository,
    private accountRepository: AccountRepository,
  ) {}

  async execute(
    request: RemoveFederatedProviderUseCaseRequest,
  ): Promise<RemoveFederatedProviderUseCaseResponse> {
    const config = await this.federatedProviderConfigRepository.findById(
      request.id,
    )
    if (!config) {
      return left(new FederatedProviderNotFoundError())
    }

    const hasLinkedIdentities =
      await this.accountRepository.existsByProvider(request.id)
    if (hasLinkedIdentities) {
      return left(new ProviderHasLinkedIdentitiesError())
    }

    await this.federatedProviderConfigRepository.delete(request.id)

    return right(undefined)
  }
}
