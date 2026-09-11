import { makeFederatedProviderConfig } from '../../../../test/factories/make-federated-provider-config'
import { InMemoryFederatedProviderConfigRepository } from '../../../../test/repositories/in-memory-federated-provider-config-repository'
import { ToggleFederatedProviderUseCase } from './toggle-federated-provider.use-case'

let sut: ToggleFederatedProviderUseCase
let inMemoryFederatedProviderConfigRepository: InMemoryFederatedProviderConfigRepository

describe('Toggle Federated Provider Use Case', () => {
  beforeEach(() => {
    inMemoryFederatedProviderConfigRepository =
      new InMemoryFederatedProviderConfigRepository()

    sut = new ToggleFederatedProviderUseCase(
      inMemoryFederatedProviderConfigRepository,
    )
  })

  it('should return an error when the provider does not exist', async () => {
    const result = await sut.execute({ id: 'missing-id', enabled: false })

    expect(result.isLeft()).toBe(true)
  })

  it('should disable an enabled provider', async () => {
    const provider = makeFederatedProviderConfig({ enabled: true })
    inMemoryFederatedProviderConfigRepository.items.push(provider)

    const result = await sut.execute({
      id: provider.id.toString(),
      enabled: false,
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryFederatedProviderConfigRepository.items[0].enabled).toBe(
      false,
    )
  })

  it('should enable a disabled provider', async () => {
    const provider = makeFederatedProviderConfig({ enabled: false })
    inMemoryFederatedProviderConfigRepository.items.push(provider)

    const result = await sut.execute({
      id: provider.id.toString(),
      enabled: true,
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryFederatedProviderConfigRepository.items[0].enabled).toBe(
      true,
    )
  })
})
