import { FederatedProviderConfig } from "@/domain/identity/entities/federated-provider-config";

export interface FederatedUserInfo {
  subject: string;
  email: string | null;
  name: string | null;
  claims: Record<string, unknown>;
}

export abstract class FederatedUserInfoFetcher {
  abstract get(
    provider: FederatedProviderConfig,
    accessToken: string,
    subject: string,
  ): Promise<FederatedUserInfo>;
}
