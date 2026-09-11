// src/application/use-cases/identity/register-federated-provider.use-case.ts
import { FederatedAuthorizationUrl } from "@/application/ports/identity/federated-authentication-url";
import { Either, left, right } from "@/core/either";
import { Slug } from "@/core/value-objects/slug";
import { Encryptor } from "@/domain/cryptography/encryptor";
import { FederatedProviderConfig } from "@/domain/identity/entities/federated-provider-config";
import { ClientSecretNotConfiguredError } from "@/domain/identity/errors/client-secret-not-configured-error";
import { ProviderDiscoveryFailedError } from "@/domain/identity/errors/provider-discovery-failed-error";
import { SlugAlreadyInUseError } from "@/domain/identity/errors/slug-already-in-use-error";
import { FederatedProviderConfigRepository } from "@/domain/identity/repositories/federated-provider-config-repository";
import { Injectable } from "@nestjs/common";

interface RegisterFederatedProviderUseCaseRequest {
  slug: string;
  displayName: string;
  issuerUrl: string;
  clientId: string;
  clientSecret: string;
  jwksUri?: string;
  scopes: string[];
  suppliesCpfClaim: boolean;
  redirectUri: string;
}

type RegisterFederatedProviderUseCaseResponse = Either<
  | SlugAlreadyInUseError
  | ClientSecretNotConfiguredError
  | ProviderDiscoveryFailedError,
  { providerId: string }
>;

@Injectable()
export class RegisterFederatedProviderUseCase {
  constructor(
    private federatedProviderConfigRepository: FederatedProviderConfigRepository,
    private federatedAuthorizationUrl: FederatedAuthorizationUrl,
    private encryptor: Encryptor,
  ) {}

  async execute(
    request: RegisterFederatedProviderUseCaseRequest,
  ): Promise<RegisterFederatedProviderUseCaseResponse> {
    const slug = Slug.createFromText(request.slug);
    const provider = await this.federatedProviderConfigRepository.findBySlug(
      slug.value,
    );
    if (provider) {
      return left(new SlugAlreadyInUseError());
    }

    if (!request.clientSecret || request.clientSecret.trim().length === 0) {
      return left(new ClientSecretNotConfiguredError());
    }

    const encryptedClientSecret = await this.encryptor.encrypt(
      request.clientSecret,
    );

    const newProvider = FederatedProviderConfig.create({
      slug,
      displayName: request.displayName,
      issuerUrl: request.issuerUrl,
      clientId: request.clientId,
      clientSecret: encryptedClientSecret,
      jwksUri: request.jwksUri ?? null,
      scopes: new Set(
        request.scopes
          .map((scope) => scope.trim().toLowerCase())
          .filter(Boolean),
      ),
      suppliesCpfClaim: request.suppliesCpfClaim,
      redirectUri: request.redirectUri,
    });

    try {
      await this.federatedAuthorizationUrl.build(newProvider);
    } catch {
      return left(new ProviderDiscoveryFailedError());
    }

    await this.federatedProviderConfigRepository.create(newProvider);

    return right({ providerId: newProvider.id.toString() });
  }
}
