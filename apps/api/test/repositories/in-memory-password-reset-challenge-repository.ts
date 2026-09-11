import { PasswordResetChallenge } from "@/domain/identity/entities/password-reset-challenge";
import { PasswordResetChallengeRepository } from "@/domain/identity/repositories/password-reset-challenge-repository";

export class InMemoryPasswordResetChallengeRepository implements PasswordResetChallengeRepository {
  public items: PasswordResetChallenge[] = [];

  async findByTokenHash(
    tokenHash: string,
  ): Promise<PasswordResetChallenge | null> {
    return this.items.find((item) => item.tokenHash === tokenHash) ?? null;
  }

  async create(challenge: PasswordResetChallenge): Promise<void> {
    this.items.push(challenge);
  }

  async save(challenge: PasswordResetChallenge): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.id.toString() === challenge.id.toString(),
    );

    if (index !== -1) {
      this.items[index] = challenge;
    }
  }

  async findById(id: string): Promise<PasswordResetChallenge | null> {
    return this.items.find((item) => item.id.toString() === id) ?? null;
  }
}
