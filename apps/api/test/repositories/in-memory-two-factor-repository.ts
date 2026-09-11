import {
  TwoFactor,
  TwoFactorType,
} from "@/domain/identity/entities/two-factor";
import { TwoFactorRepository } from "@/domain/identity/repositories/two-factor-repository";

export class InMemoryTwoFactorRepository implements TwoFactorRepository {
  public items: TwoFactor[] = [];

  async findEnabledByUserId(userId: string): Promise<TwoFactor[]> {
    const enableds = this.items.filter(
      (item) => item.userId.toString() === userId && item.isEnabled,
    );

    return enableds;
  }

  async findById(id: string): Promise<TwoFactor | null> {
    const item = this.items.find((item) => item.id.toString() === id);

    return item ?? null;
  }

  async save(twoFactor: TwoFactor): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.id.toString() === twoFactor.id.toString(),
    );

    if (index !== -1) {
      this.items[index] = twoFactor;
    }
  }

  async findByUserIdAndType(
    userId: string,
    type: TwoFactorType,
  ): Promise<TwoFactor | null> {
    const item = this.items.find(
      (item) => item.userId.toString() === userId && item.type === type,
    );

    return item ?? null;
  }
}
