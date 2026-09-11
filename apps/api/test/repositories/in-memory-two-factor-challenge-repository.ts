import { TwoFactorChallenge } from "@/domain/identity/entities/two-factor-challenge";
import { TwoFactorChallengeRepository } from "@/domain/identity/repositories/two-factor-challenge-repository";

export class InMemoryTwoFactorChallengeRepository implements TwoFactorChallengeRepository {
  public items: TwoFactorChallenge[] = [];

  async create(data: TwoFactorChallenge): Promise<void> {
    this.items.push(data);
  }

  async findById(id: string): Promise<TwoFactorChallenge | null> {
    return this.items.find((item) => item.id.toString() === id) ?? null;
  }

  async save(data: TwoFactorChallenge): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.id.toString() === data.id.toString(),
    );

    if (index !== -1) {
      this.items[index] = data;
    }
  }
}
