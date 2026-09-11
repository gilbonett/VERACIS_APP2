import { FederatedAuthorizationUrl } from "@/application/ports/identity/federated-authentication-url";
import { Either, left, right } from "@/core/either";
import { Encryptor } from "@/domain/cryptography/encryptor";
import { ClientSecretNotConfiguredError } from "@/domain/identity/errors/client-secret-not-configured-error";
import { FederatedProviderNotFoundError } from "@/domain/identity/errors/federated-provider-not-found-error";
import { ProviderDiscoveryFailedError } from "@/domain/identity/errors/provider-discovery-failed-error";
import { FederatedProviderConfigRepository } from "@/domain/identity/repositories/federated-provider-config-repository";
import { Injectable } from "@nestjs/common";

interface UpdateFederatedProviderUseCaseRequest {
  id: string;
  displayName?: string;
  issuerUrl?: string;
  clientId?: string;
  clientSecret?: string;
  scopes?: string[];
  jwksUri?: string | null;
  suppliesCpfClaim?: boolean;
  redirectUri?: string;
}

type UpdateFederatedProviderUseCaseResponse = Either<
  | FederatedProviderNotFoundError
  | ClientSecretNotConfiguredError
  | ProviderDiscoveryFailedError,
  void
>;

@Injectable()
export class UpdateFederatedProviderUseCase {
  constructor(
    private readonly federatedProviderConfigRepository: FederatedProviderConfigRepository,
    private readonly federatedAuthorizationUrl: FederatedAuthorizationUrl,
    private readonly encryptor: Encryptor,
  ) {}

  async execute(
    request: UpdateFederatedProviderUseCaseRequest,
  ): Promise<UpdateFederatedProviderUseCaseResponse> {
    const provider = await this.federatedProviderConfigRepository.findById(
      request.id,
    );

    if (!provider) {
      return left(new FederatedProviderNotFoundError());
    }

    if (
      request.clientSecret !== undefined &&
      request.clientSecret.trim().length === 0
    ) {
      return left(new ClientSecretNotConfiguredError());
    }

    const affectsConnectivity =
      request.issuerUrl !== undefined ||
      request.clientId !== undefined ||
      request.clientSecret !== undefined;

    if (request.scopes !== undefined) {
      provider.addScopes(request.scopes);
    }

    const { id: _, scopes: __, ...changes } = request;

    if (request.clientSecret !== undefined) {
      changes.clientSecret = await this.encryptor.encrypt(request.clientSecret);
    }

    provider.updateConfiguration(changes);

    if (affectsConnectivity) {
      try {
        await this.federatedAuthorizationUrl.build(provider);
      } catch {
        return left(new ProviderDiscoveryFailedError());
      }
    }

    await this.federatedProviderConfigRepository.save(provider);

    return right(undefined);
  }
}
