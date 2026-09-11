import {
  AUTH_STORE_PREFIXES,
  AuthStore,
} from "@/application/stores/auth-store";
import { RateLimiterStore } from "@/application/stores/rate-limiter-store";
import { Either, left, right } from "@/core/either";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { CodeGenerator } from "@/domain/cryptography/code-generator";
import { TokenOpaque } from "@/domain/cryptography/token-opaque";
import { TwoFactorChallenge } from "@/domain/identity/entities/two-factor-challenge";
import { LoginAttemptNotFoundError } from "@/domain/identity/errors/login-attempt-not-found-error";
import { TooManyTwoFactorRequestsError } from "@/domain/identity/errors/too-many-two-factor-requests-error";
import { TwoFactorMethodNotAvailableError } from "@/domain/identity/errors/two-factor-method-not-available-error";
import { TwoFactorChallengeRepository } from "@/domain/identity/repositories/two-factor-challenge-repository";
import { TwoFactorRepository } from "@/domain/identity/repositories/two-factor-repository";
import { UserRepository } from "@/domain/identity/repositories/user-repository";
import {
  LoginFlowChallenge,
  LoginFlowState,
} from "@/domain/identity/types/login-flow-state";
import { Injectable } from "@nestjs/common";

const TWO_FACTOR_CHALLENGE_TTL_SECONDS = 10 * 60; // 10 minutes
const TWO_FACTOR_RESEND_LIMIT = 3;
const TWO_FACTOR_RESEND_WINDOW_SECONDS = 5 * 60; // 5 minutes

interface SelectTwoFactorMethodUseCaseRequest {
  loginAttemptToken: string;
  twoFactorId: string;
}

type SelectTwoFactorMethodUseCaseResponse = Either<
  | TwoFactorMethodNotAvailableError
  | LoginAttemptNotFoundError
  | TooManyTwoFactorRequestsError,
  { loginAttemptToken: string }
>;

@Injectable()
export class SelectTwoFactorMethodUseCase {
  constructor(
    private userRepository: UserRepository,
    private twoFactorRepository: TwoFactorRepository,
    private twoFactorChallengeRepository: TwoFactorChallengeRepository,
    private authStore: AuthStore,
    private rateLimiter: RateLimiterStore,
    private tokenOpaque: TokenOpaque,
    private codeGenerator: CodeGenerator,
  ) {}

  async execute(
    request: SelectTwoFactorMethodUseCaseRequest,
  ): Promise<SelectTwoFactorMethodUseCaseResponse> {
    const loginAttemptToken = this.tokenOpaque.generate(
      request.loginAttemptToken,
    );

    const loginFlowState = await this.authStore.read<LoginFlowState>(
      AUTH_STORE_PREFIXES.LOGIN_ATTEMPT,
      loginAttemptToken.hashed,
    );

    if (!loginFlowState) {
      return left(new LoginAttemptNotFoundError());
    }

    const allowed = await this.rateLimiter.consume(
      `two-factor:resend:${loginAttemptToken.hashed}`,
      TWO_FACTOR_RESEND_LIMIT,
      TWO_FACTOR_RESEND_WINDOW_SECONDS,
    );

    if (!allowed) {
      return left(new TooManyTwoFactorRequestsError());
    }

    const twoFactor = await this.twoFactorRepository.findById(
      request.twoFactorId,
    );

    const belongsToUser =
      twoFactor?.userId.equals(new UniqueEntityID(loginFlowState.userId)) ??
      false;

    if (
      !twoFactor ||
      !belongsToUser ||
      !twoFactor.isEnabled ||
      twoFactor.isTOTP
    ) {
      return left(new TwoFactorMethodNotAvailableError());
    }

    const user = await this.userRepository.findById(loginFlowState.userId);

    if (!user) {
      return left(new TwoFactorMethodNotAvailableError());
    }

    const code = this.codeGenerator.generate();

    const { plain: codePlain, hashed: codeHash } =
      this.tokenOpaque.generate(code);

    const challenge = TwoFactorChallenge.issue({
      codeHash,
      attemptCount: 0,
      userId: twoFactor.userId,
      twoFactorId: twoFactor.id,
      ipAddress: loginFlowState.ipAddress,
      userAgent: loginFlowState.userAgent,
      deviceName: loginFlowState.deviceName,
      expiresAt: new Date(Date.now() + TWO_FACTOR_CHALLENGE_TTL_SECONDS * 1000),
    });

    if (!twoFactor.isEmail && !user.phone) {
      return left(new TwoFactorMethodNotAvailableError());
    }

    const destination = twoFactor.isEmail
      ? user.email.toValue()
      : user.phone!.toValue();

    challenge.requestCodeDelivery({
      code: codePlain,
      userId: twoFactor.userId.toString(),
      twoFactorId: twoFactor.id.toString(),
      twoFactorType: twoFactor.type,
      twoFactorChallengeId: challenge.id.toString(),
      destination: destination,
    });

    await this.twoFactorChallengeRepository.create(challenge);

    const flowState: LoginFlowChallenge = {
      ...loginFlowState,
      twoFactorId: twoFactor.id.toString(),
      twoFactorChallengeId: challenge.id.toString(),
    };

    await this.authStore.issue<LoginFlowChallenge>(
      AUTH_STORE_PREFIXES.LOGIN_ATTEMPT,
      loginAttemptToken.hashed,
      flowState,
      TWO_FACTOR_CHALLENGE_TTL_SECONDS,
    );

    return right({
      loginAttemptToken: loginAttemptToken.plain,
    });
  }
}
