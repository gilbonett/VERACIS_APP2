import { Either, left, right } from '@/core/either'
import { FederatedProviderNotFoundError } from '@/domain/identity/errors/federated-provider-not-found-error'
import { FederatedProviderConfigRepository } from '@/domain/identity/repositories/federated-provider-config-repository'
import { Injectable } from '@nestjs/common'

interface ToggleFederatedProviderUseCaseRequest {
  id: string
  enabled: boolean
}

type ToggleFederatedProviderUseCaseResponse = Either<
  FederatedProviderNotFoundError,
  void
>

@Injectable()
export class ToggleFederatedProviderUseCase {
  constructor(
    private federatedProviderConfigRepository: FederatedProviderConfigRepository,
  ) {}

  async execute(
    request: ToggleFederatedProviderUseCaseRequest,
  ): Promise<ToggleFederatedProviderUseCaseResponse> {
    const config = await this.federatedProviderConfigRepository.findById(
      request.id,
    )
    if (!config) {
      return left(new FederatedProviderNotFoundError())
    }

    if (request.enabled) {
      config.enable()
    } else {
      config.disable()
    }

    await this.federatedProviderConfigRepository.save(config)

    return right(undefined)
  }
}
