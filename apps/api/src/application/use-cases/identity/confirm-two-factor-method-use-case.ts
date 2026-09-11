import {
  AUTH_STORE_PREFIXES,
  AuthStore,
} from "@/application/stores/auth-store";
import { Either, left, right } from "@/core/either";
import { TokenOpaque } from "@/domain/cryptography/token-opaque";
import { InvalidOtpCodeError } from "@/domain/identity/errors/invalid-otp-code-error";
import { OtpAttemptsExceededError } from "@/domain/identity/errors/otp-attempts-exceeded-error";
import { TwoFactorChallengeExpiredError } from "@/domain/identity/errors/two-factor-challenge-expired-error";
import { TwoFactorChallengeNotFoundError } from "@/domain/identity/errors/two-factor-challenge-not-found-error";
import { TwoFactorChallengeRepository } from "@/domain/identity/repositories/two-factor-challenge-repository";
import { TwoFactorRepository } from "@/domain/identity/repositories/two-factor-repository";
import { LoginFlowChallenge } from "@/domain/identity/types/login-flow-state";
import { Injectable } from "@nestjs/common";
import { IssueAuthenticatedSessionUseCase } from "./issue-authenticated-session-use-case";

interface ConfirmTwoFactorChallengeUseCaseRequest {
  loginAttemptToken: string;
  code: string;
}

type ConfirmTwoFactorChallengeUseCaseResponse = Either<
  | TwoFactorChallengeNotFoundError
  | TwoFactorChallengeExpiredError
  | InvalidOtpCodeError
  | OtpAttemptsExceededError,
  { status: "AUTHENTICATED"; accessToken: string; refreshToken: string }
>;

@Injectable()
export class ConfirmTwoFactorChallengeUseCase {
  constructor(
    private twoFactorChallengeRepository: TwoFactorChallengeRepository,
    private twoFactorRepository: TwoFactorRepository,
    private authStore: AuthStore,
    private tokenOpaque: TokenOpaque,
    private issueAuthenticatedSessionUseCase: IssueAuthenticatedSessionUseCase,
  ) {}

  async execute(
    request: ConfirmTwoFactorChallengeUseCaseRequest,
  ): Promise<ConfirmTwoFactorChallengeUseCaseResponse> {
    const loginAttemptToken = this.tokenOpaque.generate(
      request.loginAttemptToken,
    );

    const flowState = await this.authStore.read<LoginFlowChallenge>(
      AUTH_STORE_PREFIXES.LOGIN_ATTEMPT,
      loginAttemptToken.hashed,
    );

    if (!flowState) {
      return left(new TwoFactorChallengeNotFoundError());
    }

    const challenge = await this.twoFactorChallengeRepository.findById(
      flowState.twoFactorChallengeId,
    );

    if (!challenge) {
      return left(new TwoFactorChallengeNotFoundError());
    }

    if (challenge.isExpired) {
      challenge.markExpired();
      await this.twoFactorChallengeRepository.save(challenge);
      return left(new TwoFactorChallengeExpiredError());
    }

    if (!challenge.isPending) {
      return left(new TwoFactorChallengeExpiredError());
    }

    const candidateCode = this.tokenOpaque.generate(request.code);

    if (!challenge.canAttempt()) {
      await this.authStore.revoke(
        AUTH_STORE_PREFIXES.LOGIN_ATTEMPT,
        loginAttemptToken.hashed,
      );
      return left(new OtpAttemptsExceededError());
    }

    if (!challenge.verifyCode(candidateCode.hashed)) {
      challenge.incrementAttemptCount();
      await this.twoFactorChallengeRepository.save(challenge);
      return left(new InvalidOtpCodeError());
    }

    challenge.markVerified();
    await this.twoFactorChallengeRepository.save(challenge);

    const twoFactor = await this.twoFactorRepository.findById(
      challenge.twoFactorId.toString(),
    );

    if (twoFactor) {
      twoFactor.markAsUsed();
      await this.twoFactorRepository.save(twoFactor);
    }

    const { accessToken, refreshToken } =
      await this.issueAuthenticatedSessionUseCase.execute({
        userId: flowState.userId,
        assuranceLevel: "MEDIUM",
        ipAddress: flowState.ipAddress,
        userAgent: flowState.userAgent,
        deviceName: flowState.deviceName,
      });

    await this.authStore.revoke(
      AUTH_STORE_PREFIXES.LOGIN_ATTEMPT,
      loginAttemptToken.hashed,
    );

    return right({ status: "AUTHENTICATED", accessToken, refreshToken });
  }
}
