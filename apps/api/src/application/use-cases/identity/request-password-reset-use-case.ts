import { RateLimiterStore } from "@/application/stores/rate-limiter-store";
import { Either, right } from "@/core/either";
import { TokenOpaque } from "@/domain/cryptography/token-opaque";
import { PasswordResetChallenge } from "@/domain/identity/entities/password-reset-challenge";
import { PasswordResetChallengeRepository } from "@/domain/identity/repositories/password-reset-challenge-repository";
import { UserRepository } from "@/domain/identity/repositories/user-repository";
import { Email } from "@/domain/identity/value-objects/email";
import { Injectable } from "@nestjs/common";

const PASSWORD_RESET_TTL_SECONDS = 30 * 60;

const RESET_RATE_LIMIT_BY_IP = 10;
const RESET_RATE_WINDOW_BY_IP_SECONDS = 15 * 60;
const RESET_RATE_LIMIT_BY_EMAIL = 3;
const RESET_RATE_WINDOW_BY_EMAIL_SECONDS = 60 * 60;

interface RequestPasswordResetUseCaseRequest {
  email: string;
  ipAddress: string;
  userAgent: string;
  deviceName: string;
}

type RequestPasswordResetUseCaseResponse = Either<never, void>;

@Injectable()
export class RequestPasswordResetUseCase {
  constructor(
    private userRepository: UserRepository,
    private passwordResetChallengeRepository: PasswordResetChallengeRepository,
    private tokenOpaque: TokenOpaque,
    private rateLimiter: RateLimiterStore,
  ) {}

  async execute(
    request: RequestPasswordResetUseCaseRequest,
  ): Promise<RequestPasswordResetUseCaseResponse> {
    const emailOrError = Email.create(request.email);

    if (emailOrError.isLeft()) {
      return right(undefined);
    }

    const email = emailOrError.value;

    const allowedByIp = await this.rateLimiter.consume(
      `password-reset:ip:${request.ipAddress}`,
      RESET_RATE_LIMIT_BY_IP,
      RESET_RATE_WINDOW_BY_IP_SECONDS,
    );

    const allowedByEmail = await this.rateLimiter.consume(
      `password-reset:email:${email.toValue()}`,
      RESET_RATE_LIMIT_BY_EMAIL,
      RESET_RATE_WINDOW_BY_EMAIL_SECONDS,
    );

    if (!allowedByIp || !allowedByEmail) {
      return right(undefined);
    }

    const user = await this.userRepository.findUniqueByEmail(email.toValue());

    if (!user) {
      return right(undefined);
    }

    const passwordResetToken = this.tokenOpaque.generate();

    const challenge = PasswordResetChallenge.issue({
      userId: user.id,
      tokenHash: passwordResetToken.hashed,
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_SECONDS * 1000),
      deviceName: request.deviceName,
    });

    challenge.requestResetDelivery(
      user.email.toValue(),
      passwordResetToken.plain,
    );

    await this.passwordResetChallengeRepository.create(challenge);

    return right(undefined);
  }
}
