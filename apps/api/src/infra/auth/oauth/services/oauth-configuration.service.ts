import { Encryptor } from "@/domain/cryptography/encryptor";
import { FederatedProviderConfig } from "@/domain/identity/entities/federated-provider-config";
import { Injectable } from "@nestjs/common";
import { Configuration, discovery } from "openid-client";

@Injectable()
export class OAuthConfigurationService {
  private readonly cache = new Map<string, Configuration>();

  constructor(private readonly encryptor: Encryptor) {}

  async get(provider: FederatedProviderConfig): Promise<Configuration> {
    const cacheKey = provider.id.toString();
    const cached = this.cache.get(cacheKey);

    if (cached) return cached;

    const clientSecret = await this.encryptor.decrypt(provider.clientSecret);

    try {
      const config = await discovery(
        new URL(provider.issuerUrl),
        provider.clientId,
        clientSecret,
      );

      this.cache.set(cacheKey, config);
      return config;
    } catch {
      this.cache.delete(cacheKey);
      throw new Error("Failed to discover configuration");
    }
  }
}
