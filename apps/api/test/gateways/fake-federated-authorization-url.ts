import {
  AuthorizationRequest,
  FederatedAuthorizationUrl,
} from '@/application/ports/identity/federated-authentication-url'
import { FederatedProviderConfig } from '@/domain/identity/entities/federated-provider-config'

export class FakeFederatedAuthorizationUrl extends FederatedAuthorizationUrl {
  public authorizationRequest: AuthorizationRequest = {
    authorizationUrl: 'https://idp.example.com/authorize',
    state: 'fake-state',
    nonce: 'fake-nonce',
    codeVerifier: 'fake-code-verifier',
  }

  public shouldFail = false

  async build(
    _provider: FederatedProviderConfig,
  ): Promise<AuthorizationRequest> {
    if (this.shouldFail) {
      throw new Error('provider discovery failed')
    }
    return this.authorizationRequest
  }
}
