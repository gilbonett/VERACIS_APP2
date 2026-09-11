import { FederatedProviderConfig } from "@/domain/identity/entities/federated-provider-config";

export type FederatedIdentityIdentifier =
  | {
      type: "CPF";
      value: string;
    }
  | {
      type: "EMAIL";
      value: string;
    }
  | null;

export interface CallbackResult {
  subject: string;
  email: string | null;
  name: string | null;
  cpf: string | null;
  rawAssuranceClaim: string | null;
  identityIdentifier: FederatedIdentityIdentifier;
  accessToken: string;
  refreshToken: string | null;
  idToken: string | null;
  accessTokenExpiresAt: Date | null;
  scope: string | null;
}

export interface FederatedCallbackInput {
  provider: FederatedProviderConfig;
  code: string;
  redirectUri: string;
  expectedNonce: string;
  codeVerifier: string;
}

export abstract class FederatedAuthenticationCallback {
  abstract handle(input: FederatedCallbackInput): Promise<CallbackResult>;
}
