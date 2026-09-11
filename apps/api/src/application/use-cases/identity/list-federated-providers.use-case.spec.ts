import { makeFederatedProviderConfig } from '../../../../test/factories/make-federated-provider-config'
import { InMemoryFederatedProviderConfigRepository } from '../../../../test/repositories/in-memory-federated-provider-config-repository'
import { ListFederatedProvidersUseCase } from './list-federated-providers.use-case'

let sut: ListFederatedProvidersUseCase
let inMemoryFederatedProviderConfigRepository: InMemoryFederatedProviderConfigRepository

describe('List Federated Providers Use Case', () => {
  beforeEach(() => {
    inMemoryFederatedProviderConfigRepository =
      new InMemoryFederatedProviderConfigRepository()

    sut = new ListFederatedProvidersUseCase(
      inMemoryFederatedProviderConfigRepository,
    )
  })

  it('should return an empty list when there are no registered providers', async () => {
    const result = await sut.execute()

    expect(result.isRight()).toBe(true)
    if (result.isLeft()) throw new Error('expected right')
    expect(result.value.providers).toHaveLength(0)
  })

  it('should return every registered provider regardless of enabled state', async () => {
    const enabledProvider = makeFederatedProviderConfig({ enabled: true })
    const disabledProvider = makeFederatedProviderConfig({ enabled: false })
    inMemoryFederatedProviderConfigRepository.items.push(
      enabledProvider,
      disabledProvider,
    )

    const result = await sut.execute()

    expect(result.isRight()).toBe(true)
    if (result.isLeft()) throw new Error('expected right')
    expect(result.value.providers).toHaveLength(2)
    expect(result.value.providers).toEqual(
      expect.arrayContaining([enabledProvider, disabledProvider]),
    )
  })
})
