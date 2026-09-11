import { FederatedProviderConfig } from "../entities/federated-provider-config";

export abstract class FederatedProviderConfigRepository {
  abstract findById(id: string): Promise<FederatedProviderConfig | null>;
  abstract findBySlug(slug: string): Promise<FederatedProviderConfig | null>;
  abstract findAll(): Promise<FederatedProviderConfig[]>;
  abstract create(config: FederatedProviderConfig): Promise<void>;
  abstract save(config: FederatedProviderConfig): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
