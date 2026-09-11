import { Either, left, right } from "@/core/either";
import { PasswordInvalidError } from "@/core/value-objects/errors/password-invalid-error";
import { Password } from "@/core/value-objects/password";
import { HashGenerator } from "@/domain/cryptography/hash-generator";
import { TokenOpaque } from "@/domain/cryptography/token-opaque";
import { PasswordResetTokenInvalidError } from "@/domain/identity/errors/password-reset-token-invalid-error";
import { AccountRepository } from "@/domain/identity/repositories/account-repository";
import { PasswordResetChallengeRepository } from "@/domain/identity/repositories/password-reset-challenge-repository";
import { SessionRepository } from "@/domain/identity/repositories/session-repository";
import { SessionTokenRepository } from "@/domain/identity/repositories/session-token-repository";
import { revokeAllUserSessions } from "@/domain/identity/services/revoke-all-user-sessions";
import { Injectable } from "@nestjs/common";

interface ConfirmPasswordResetUseCaseRequest {
  token: string;
  newPassword: string;
}

type ConfirmPasswordResetUseCaseResponse = Either<
  PasswordResetTokenInvalidError | PasswordInvalidError,
  void
>;

@Injectable()
export class ConfirmPasswordResetUseCase {
  constructor(
    private passwordResetChallengeRepository: PasswordResetChallengeRepository,
    private accountRepository: AccountRepository,
    private sessionRepository: SessionRepository,
    private sessionTokenRepository: SessionTokenRepository,
    private hashGenerator: HashGenerator,
    private tokenOpaque: TokenOpaque,
  ) {}

  async execute(
    request: ConfirmPasswordResetUseCaseRequest,
  ): Promise<ConfirmPasswordResetUseCaseResponse> {
    const { hashed: tokenHash } = this.tokenOpaque.generate(request.token);

    const challenge =
      await this.passwordResetChallengeRepository.findByTokenHash(tokenHash);

    if (!challenge) {
      return left(new PasswordResetTokenInvalidError());
    }

    if (challenge.isExpired) {
      challenge.markExpired();
      await this.passwordResetChallengeRepository.save(challenge);
      return left(new PasswordResetTokenInvalidError());
    }

    if (!challenge.isPending) {
      return left(new PasswordResetTokenInvalidError());
    }

    const passwordOrError = Password.create(request.newPassword);
    if (passwordOrError.isLeft()) {
      return left(passwordOrError.value);
    }

    const account = await this.accountRepository.findCredentialByUserId(
      challenge.userId.toString(),
    );
    if (!account) {
      return left(new PasswordResetTokenInvalidError());
    }

    challenge.markConsumed();
    await this.passwordResetChallengeRepository.save(challenge);

    const newHash = await this.hashGenerator.hash(
      passwordOrError.value.toValue(),
    );
    account.updatePassword(newHash);
    await this.accountRepository.save(account);

    await revokeAllUserSessions(
      this.sessionRepository,
      this.sessionTokenRepository,
      challenge.userId.toString(),
      "PASSWORD_CHANGED",
    );

    return right(undefined);
  }
}
