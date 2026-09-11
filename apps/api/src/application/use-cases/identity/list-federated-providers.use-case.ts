import { Either, right } from '@/core/either'
import { FederatedProviderConfig } from '@/domain/identity/entities/federated-provider-config'
import { FederatedProviderConfigRepository } from '@/domain/identity/repositories/federated-provider-config-repository'
import { Injectable } from '@nestjs/common'

type ListFederatedProvidersUseCaseResponse = Either<
  never,
  { providers: FederatedProviderConfig[] }
>

@Injectable()
export class ListFederatedProvidersUseCase {
  constructor(
    private federatedProviderConfigRepository: FederatedProviderConfigRepository,
  ) {}

  async execute(): Promise<ListFederatedProvidersUseCaseResponse> {
    const providers = await this.federatedProviderConfigRepository.findAll()
    // habilitado e desabilitado, sem filtro - quem decide o que mostrar é a tela de admin
    return right({ providers })
  }
}
