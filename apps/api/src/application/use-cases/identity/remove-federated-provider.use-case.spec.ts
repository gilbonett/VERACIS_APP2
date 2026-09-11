import { makeFederatedAccount } from '../../../../test/factories/make-account'
import { makeFederatedProviderConfig } from '../../../../test/factories/make-federated-provider-config'
import { InMemoryAccountRepository } from '../../../../test/repositories/in-memory-account-repository'
import { InMemoryFederatedProviderConfigRepository } from '../../../../test/repositories/in-memory-federated-provider-config-repository'
import { RemoveFederatedProviderUseCase } from './remove-federated-provider.use-case'

let sut: RemoveFederatedProviderUseCase
let inMemoryFederatedProviderConfigRepository: InMemoryFederatedProviderConfigRepository
let inMemoryAccountRepository: InMemoryAccountRepository

describe('Remove Federated Provider Use Case', () => {
  beforeEach(() => {
    inMemoryFederatedProviderConfigRepository =
      new InMemoryFederatedProviderConfigRepository()
    inMemoryAccountRepository = new InMemoryAccountRepository()

    sut = new RemoveFederatedProviderUseCase(
      inMemoryFederatedProviderConfigRepository,
      inMemoryAccountRepository,
    )
  })

  it('should return an error when the provider does not exist', async () => {
    const result = await sut.execute({ id: 'missing-id' })

    expect(result.isLeft()).toBe(true)
  })

  it('should return an error when the provider still has linked identities', async () => {
    const provider = makeFederatedProviderConfig()
    inMemoryFederatedProviderConfigRepository.items.push(provider)
    inMemoryAccountRepository.items.push(
      makeFederatedAccount({ providerId: provider.id.toString() }),
    )

    const result = await sut.execute({ id: provider.id.toString() })

    expect(result.isLeft()).toBe(true)
    expect(inMemoryFederatedProviderConfigRepository.items).toHaveLength(1)
  })

  it('should delete the provider when it has no linked identities', async () => {
    const provider = makeFederatedProviderConfig()
    inMemoryFederatedProviderConfigRepository.items.push(provider)

    const result = await sut.execute({ id: provider.id.toString() })

    expect(result.isRight()).toBe(true)
    expect(inMemoryFederatedProviderConfigRepository.items).toHaveLength(0)
  })
})
