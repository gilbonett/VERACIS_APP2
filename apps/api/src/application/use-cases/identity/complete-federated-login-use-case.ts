import {
  CallbackResult,
  FederatedAuthenticationCallback,
} from "@/application/ports/identity/federated-authentication-callback";
import {
  AUTH_STORE_PREFIXES,
  AuthStore,
} from "@/application/stores/auth-store";
import { Either, left, right } from "@/core/either";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Account } from "@/domain/identity/entities/account";
import { FederatedProviderConfig } from "@/domain/identity/entities/federated-provider-config";
import { SessionAssuranceLevel } from "@/domain/identity/entities/session";
import { User } from "@/domain/identity/entities/user";
import { FederatedAssuranceInsufficientError } from "@/domain/identity/errors/federated-assurance-insufficient-error";
import { FederatedStateInvalidError } from "@/domain/identity/errors/federated-state-invalid-error";
import { FederatedTokenInvalidError } from "@/domain/identity/errors/federated-token-invalid-error";
import { ProviderNotAvailableError } from "@/domain/identity/errors/provider-not-available-error";
import { AccountRepository } from "@/domain/identity/repositories/account-repository";
import { FederatedProviderConfigRepository } from "@/domain/identity/repositories/federated-provider-config-repository";
import { UserRepository } from "@/domain/identity/repositories/user-repository";
import { translateAssuranceLevel } from "@/domain/identity/services/translate-assurance-level";
import { FederatedAttemptStoreData } from "@/domain/identity/types/federated-attempt-state";
import { FederatedOnboardingState } from "@/domain/identity/types/federated-onboarding-state";
import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { IssueAuthenticatedSessionUseCase } from "./issue-authenticated-session-use-case";

const ONBOARDING_TTL_SECONDS = 10 * 60;

interface CompleteFederatedLoginUseCaseRequest {
  slug: string;
  code: string;
  state: string;
  federatedAttemptId: string;
  ipAddress: string;
  userAgent: string;
  deviceName: string;
}

type CompleteFederatedLoginUseCaseResponse = Either<
  | ProviderNotAvailableError
  | FederatedStateInvalidError
  | FederatedTokenInvalidError
  | FederatedAssuranceInsufficientError,
  | { status: "AUTHENTICATED"; accessToken: string; refreshToken: string }
  | {
      status: "ONBOARDING_REQUIRED";
      federatedOnboardingId: string;
      name: string | null;
      email: string | null;
      cpf: string | null;
    }
>;

@Injectable()
export class CompleteFederatedLoginUseCase {
  constructor(
    private federatedProviderConfigRepository: FederatedProviderConfigRepository,
    private accountRepository: AccountRepository,
    private userRepository: UserRepository,
    private federatedAuthenticationCallback: FederatedAuthenticationCallback,
    private authStore: AuthStore,
    private issueAuthenticatedSessionUseCase: IssueAuthenticatedSessionUseCase,
  ) {}

  async execute(
    request: CompleteFederatedLoginUseCaseRequest,
  ): Promise<CompleteFederatedLoginUseCaseResponse> {
    const provider = await this.federatedProviderConfigRepository.findBySlug(
      request.slug,
    );

    if (!provider || !provider.enabled) {
      return left(new ProviderNotAvailableError());
    }

    const attempt = await this.authStore.consume<FederatedAttemptStoreData>(
      AUTH_STORE_PREFIXES.FEDERATED_ATTEMPT,
      request.federatedAttemptId,
    );

    if (!attempt || request.federatedAttemptId !== request.state) {
      return left(new FederatedStateInvalidError());
    }

    if (attempt.providerId !== provider.id.toString()) {
      return left(new FederatedStateInvalidError());
    }

    const callbackResult = await this.authenticateWithProvider(
      provider,
      attempt,
      request,
    );

    if (callbackResult.isLeft()) {
      return left(callbackResult.value);
    }

    const result = callbackResult.value;

    const assuranceLevel = translateAssuranceLevel(result.rawAssuranceClaim);
    const providerId = provider.id.toString();

    const existingIdentity =
      await this.accountRepository.findByProviderAndAccountId(
        providerId,
        result.subject,
      );

    if (existingIdentity) {
      return right(
        await this.authenticate(
          existingIdentity.userId.toString(),
          assuranceLevel,
          request,
        ),
      );
    }

    const existingUser = await this.findExistingUser(provider, result);

    if (existingUser) {
      if (assuranceLevel === "LOW") {
        return left(new FederatedAssuranceInsufficientError());
      }

      await this.linkIdentity(existingUser, provider.id, result);

      return right(
        await this.authenticate(
          existingUser.id.toString(),
          assuranceLevel,
          request,
        ),
      );
    }

    return right(await this.createOnboarding(provider, result));
  }

  private async linkIdentity(
    user: User,
    providerId: UniqueEntityID,
    result: CallbackResult,
  ) {
    const account = Account.createFederated({
      userId: user.id,
      providerId: providerId.toString(),
      accountId: result.subject,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      idToken: result.idToken,
      accessTokenExpiresAt: result.accessTokenExpiresAt,
      scope: result.scope,
      rawAssuranceClaim: result.rawAssuranceClaim,
    });
    await this.accountRepository.create(account);
  }

  private async createOnboarding(
    provider: FederatedProviderConfig,
    result: CallbackResult,
  ) {
    const federatedOnboardingId = randomUUID();

    await this.authStore.issue<FederatedOnboardingState>(
      AUTH_STORE_PREFIXES.FEDERATED_ONBOARDING,
      federatedOnboardingId,
      {
        provider: provider.id.toString(),
        providerSub: result.subject,
        providerEmail: result.email,
        providerName: result.name,
        cpfFromProvider: result.cpf,
        rawAssuranceClaim: result.rawAssuranceClaim,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        idToken: result.idToken,
        accessTokenExpiresAt: result.accessTokenExpiresAt?.toISOString() ?? null,
        scope: result.scope,
      },
      ONBOARDING_TTL_SECONDS,
    );

    return {
      status: "ONBOARDING_REQUIRED" as const,
      federatedOnboardingId,
      name: result.name,
      email: result.email,
      cpf: result.cpf,
    };
  }

  private async findExistingUser(
    provider: FederatedProviderConfig,
    result: CallbackResult,
  ): Promise<User | null> {
    if (provider.suppliesCpfClaim) {
      if (!result.cpf) {
        return null;
      }

      return this.userRepository.findUniqueByCpf(result.cpf);
    }

    if (!result.email) {
      return null;
    }

    return this.userRepository.findUniqueByEmail(result.email);
  }

  private async authenticate(
    userId: string,
    assuranceLevel: SessionAssuranceLevel,
    request: CompleteFederatedLoginUseCaseRequest,
  ) {
    const { accessToken, refreshToken } =
      await this.issueAuthenticatedSessionUseCase.execute({
        userId,
        assuranceLevel,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        deviceName: request.deviceName,
      });
    return { status: "AUTHENTICATED" as const, accessToken, refreshToken };
  }

  private async authenticateWithProvider(
    provider: FederatedProviderConfig,
    attempt: {
      nonce: string;
      codeVerifier: string;
    },
    request: CompleteFederatedLoginUseCaseRequest,
  ): Promise<Either<FederatedTokenInvalidError, CallbackResult>> {
    try {
      const result = await this.federatedAuthenticationCallback.handle({
        provider,
        code: request.code,
        redirectUri: provider.redirectUri,
        expectedNonce: attempt.nonce,
        codeVerifier: attempt.codeVerifier,
      });

      return right(result);
    } catch {
      return left(new FederatedTokenInvalidError());
    }
  }
}
