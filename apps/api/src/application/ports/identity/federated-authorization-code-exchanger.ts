import { FederatedProviderConfig } from "@/domain/identity/entities/federated-provider-config";

export type FederatedAuthorizationCodeInput = {
  provider: FederatedProviderConfig;
  redirectUri: string;
  code: string;
  codeVerifier: string;
  expectedNonce: string;
};

export type FederatedTokenResult = {
  accessToken: string;
  refreshToken: string | null;
  idToken: string | null;
  expiresIn: number | null;
  scope: string | null;
  claims: Record<string, unknown> | null;
};

export abstract class FederatedAuthorizationCodeExchanger {
  abstract exchange(
    input: FederatedAuthorizationCodeInput,
  ): Promise<FederatedTokenResult>;
}
