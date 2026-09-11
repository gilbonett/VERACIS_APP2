import { PasswordResetChallenge } from "../entities/password-reset-challenge";

export abstract class PasswordResetChallengeRepository {
  abstract create(challenge: PasswordResetChallenge): Promise<void>;
  abstract save(challenge: PasswordResetChallenge): Promise<void>;
  abstract findById(id: string): Promise<PasswordResetChallenge | null>;
  abstract findByTokenHash(
    tokenHash: string,
  ): Promise<PasswordResetChallenge | null>;
}
