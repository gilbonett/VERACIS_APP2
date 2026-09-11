import { FakeEncryptor } from '../../../../test/cryptography/fake-encryptor'
import { makeFederatedProviderConfig } from '../../../../test/factories/make-federated-provider-config'
import { FakeFederatedAuthorizationUrl } from '../../../../test/gateways/fake-federated-authorization-url'
import { InMemoryFederatedProviderConfigRepository } from '../../../../test/repositories/in-memory-federated-provider-config-repository'
import { UpdateFederatedProviderUseCase } from './update-federated-provider.use-case'

let sut: UpdateFederatedProviderUseCase
let inMemoryFederatedProviderConfigRepository: InMemoryFederatedProviderConfigRepository
let fakeFederatedAuthorizationUrl: FakeFederatedAuthorizationUrl
let fakeEncryptor: FakeEncryptor

describe('Update Federated Provider Use Case', () => {
  beforeEach(() => {
    inMemoryFederatedProviderConfigRepository =
      new InMemoryFederatedProviderConfigRepository()
    fakeFederatedAuthorizationUrl = new FakeFederatedAuthorizationUrl()
    fakeEncryptor = new FakeEncryptor()

    sut = new UpdateFederatedProviderUseCase(
      inMemoryFederatedProviderConfigRepository,
      fakeFederatedAuthorizationUrl,
      fakeEncryptor,
    )
  })

  it('should return an error when the provider does not exist', async () => {
    const result = await sut.execute({ id: 'missing-id', displayName: 'x' })

    expect(result.isLeft()).toBe(true)
  })

  it('should return an error when clientSecret is explicitly set to an empty string', async () => {
    const provider = makeFederatedProviderConfig()
    inMemoryFederatedProviderConfigRepository.items.push(provider)

    const result = await sut.execute({
      id: provider.id.toString(),
      clientSecret: '   ',
    })

    expect(result.isLeft()).toBe(true)
  })

  it('should update fields that do not affect connectivity without checking the issuer', async () => {
    const provider = makeFederatedProviderConfig()
    inMemoryFederatedProviderConfigRepository.items.push(provider)

    const result = await sut.execute({
      id: provider.id.toString(),
      displayName: 'Novo nome',
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryFederatedProviderConfigRepository.items[0].displayName).toBe(
      'Novo nome',
    )
  })

  it('should return an error and not persist when changing the issuer and it becomes unreachable', async () => {
    const provider = makeFederatedProviderConfig()
    inMemoryFederatedProviderConfigRepository.items.push(provider)
    fakeFederatedAuthorizationUrl.shouldFail = true

    const result = await sut.execute({
      id: provider.id.toString(),
      issuerUrl: 'https://new-issuer.example.com',
    })

    expect(result.isLeft()).toBe(true)
  })

  it('should encrypt a newly provided client secret before persisting', async () => {
    const provider = makeFederatedProviderConfig()
    inMemoryFederatedProviderConfigRepository.items.push(provider)

    const result = await sut.execute({
      id: provider.id.toString(),
      clientSecret: 'new-secret',
    })

    expect(result.isRight()).toBe(true)
    expect(
      inMemoryFederatedProviderConfigRepository.items[0].clientSecret,
    ).toBe('encrypted:new-secret')
  })
})
