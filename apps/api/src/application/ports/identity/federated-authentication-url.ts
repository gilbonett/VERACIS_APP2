import { FederatedProviderConfig } from "@/domain/identity/entities/federated-provider-config";

export interface AuthorizationRequest {
  authorizationUrl: string;
  state: string;
  nonce: string;
  codeVerifier: string;
}

export abstract class FederatedAuthorizationUrl {
  abstract build(
    provider: FederatedProviderConfig,
  ): Promise<AuthorizationRequest>;
}
