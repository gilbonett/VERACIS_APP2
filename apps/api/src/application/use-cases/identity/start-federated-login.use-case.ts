import { FederatedAuthorizationUrl } from "@/application/ports/identity/federated-authentication-url";

import {
  AUTH_STORE_PREFIXES,
  AuthStore,
} from "@/application/stores/auth-store";
import { Either, left, right } from "@/core/either";
import { ProviderNotAvailableError } from "@/domain/identity/errors/provider-not-available-error";
import { FederatedProviderConfigRepository } from "@/domain/identity/repositories/federated-provider-config-repository";
import { FederatedAttemptStoreData } from "@/domain/identity/types/federated-attempt-state";
import { Injectable } from "@nestjs/common";

const FEDERATED_ATTEMPT_TTL_SECONDS = 10 * 60;

interface StartFederatedLoginUseCaseRequest {
  slug: string;
}

type StartFederatedLoginUseCaseResponse = Either<
  ProviderNotAvailableError,
  { authorizationUrl: string; federatedAttemptId: string }
>;

@Injectable()
export class StartFederatedLoginUseCase {
  constructor(
    private federatedProviderConfigRepository: FederatedProviderConfigRepository,
    private federatedAuthorizationUrl: FederatedAuthorizationUrl,
    private authStore: AuthStore,
  ) {}

  async execute(
    request: StartFederatedLoginUseCaseRequest,
  ): Promise<StartFederatedLoginUseCaseResponse> {
    const provider = await this.federatedProviderConfigRepository.findBySlug(
      request.slug,
    );
    if (!provider || !provider.enabled) {
      return left(new ProviderNotAvailableError());
    }

    const { state, nonce, authorizationUrl, codeVerifier } =
      await this.federatedAuthorizationUrl.build(provider);

    const federatedAttemptId = state;

    await this.authStore.issue<FederatedAttemptStoreData>(
      AUTH_STORE_PREFIXES.FEDERATED_ATTEMPT,
      federatedAttemptId,
      {
        nonce,
        codeVerifier,
        providerId: provider.id.toString(),
      },
      FEDERATED_ATTEMPT_TTL_SECONDS,
    );

    return right({
      authorizationUrl,
      federatedAttemptId,
    });
  }
}
