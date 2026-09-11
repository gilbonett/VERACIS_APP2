import {
  CallbackResult,
  FederatedAuthenticationCallback,
  FederatedCallbackInput,
} from '@/application/ports/identity/federated-authentication-callback'

export class FakeFederatedAuthenticationCallback extends FederatedAuthenticationCallback {
  public callbackResult: CallbackResult = {
    subject: 'provider-subject-01',
    email: 'maria.silva@example.com',
    name: 'Maria Silva',
    cpf: null,
    rawAssuranceClaim: null,
    identityIdentifier: null,
    accessToken: 'fake-access-token',
    refreshToken: 'fake-refresh-token',
    idToken: 'fake-id-token',
    accessTokenExpiresAt: new Date(Date.now() + 3600 * 1000),
    scope: 'openid profile email',
  }

  public shouldFail = false

  async handle(_input: FederatedCallbackInput): Promise<CallbackResult> {
    if (this.shouldFail) {
      throw new Error('token exchange failed')
    }
    return this.callbackResult
  }
}
