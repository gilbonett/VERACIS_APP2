import { FakeEncryptor } from '../../../../test/cryptography/fake-encryptor'
import { FakeFederatedAuthorizationUrl } from '../../../../test/gateways/fake-federated-authorization-url'
import { InMemoryFederatedProviderConfigRepository } from '../../../../test/repositories/in-memory-federated-provider-config-repository'
import { RegisterFederatedProviderUseCase } from './register-federated-provider.use-case'

let sut: RegisterFederatedProviderUseCase
let inMemoryFederatedProviderConfigRepository: InMemoryFederatedProviderConfigRepository
let fakeFederatedAuthorizationUrl: FakeFederatedAuthorizationUrl
let fakeEncryptor: FakeEncryptor

const validRequest = {
  slug: 'gov-br',
  displayName: 'Gov.br',
  issuerUrl: 'https://sso.acesso.gov.br',
  clientId: 'client-01',
  clientSecret: 'super-secret',
  scopes: ['openid', 'email', 'profile'],
  suppliesCpfClaim: true,
  redirectUri: 'https://api.example.com/session/federated/gov-br/callback',
}

describe('Register Federated Provider Use Case', () => {
  beforeEach(() => {
    inMemoryFederatedProviderConfigRepository =
      new InMemoryFederatedProviderConfigRepository()
    fakeFederatedAuthorizationUrl = new FakeFederatedAuthorizationUrl()
    fakeEncryptor = new FakeEncryptor()

    sut = new RegisterFederatedProviderUseCase(
      inMemoryFederatedProviderConfigRepository,
      fakeFederatedAuthorizationUrl,
      fakeEncryptor,
    )
  })

  it('should return an error when the slug is already in use', async () => {
    await sut.execute(validRequest)

    const result = await sut.execute(validRequest)

    expect(result.isLeft()).toBe(true)
    expect(inMemoryFederatedProviderConfigRepository.items).toHaveLength(1)
  })

  it('should return an error when the client secret is empty', async () => {
    const result = await sut.execute({ ...validRequest, clientSecret: '  ' })

    expect(result.isLeft()).toBe(true)
    expect(inMemoryFederatedProviderConfigRepository.items).toHaveLength(0)
  })

  it('should return an error and not persist when the issuer is unreachable', async () => {
    fakeFederatedAuthorizationUrl.shouldFail = true

    const result = await sut.execute(validRequest)

    expect(result.isLeft()).toBe(true)
    expect(inMemoryFederatedProviderConfigRepository.items).toHaveLength(0)
  })

  describe('when registration succeeds', () => {
    let result: Awaited<ReturnType<typeof sut.execute>>

    beforeEach(async () => {
      result = await sut.execute(validRequest)
    })

    it('should return success', () => {
      expect(result.isRight()).toBe(true)
    })

    it('should persist the provider with the client secret encrypted', () => {
      const persisted = inMemoryFederatedProviderConfigRepository.items[0]
      expect(persisted).toBeDefined()
      expect(persisted.clientSecret).toBe('encrypted:super-secret')
      expect(persisted.slug.value).toBe('gov-br')
    })

    it("should return the persisted provider's id", () => {
      if (result.isLeft()) throw new Error('expected right')
      const persisted = inMemoryFederatedProviderConfigRepository.items[0]
      expect(result.value.providerId).toBe(persisted.id.toString())
    })
  })
})
