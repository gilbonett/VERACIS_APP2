import { TwoFactor, TwoFactorType } from "../entities/two-factor";

export abstract class TwoFactorRepository {
  abstract findEnabledByUserId(userId: string): Promise<TwoFactor[]>;
  abstract findById(id: string): Promise<TwoFactor | null>;
  abstract save(twoFactor: TwoFactor): Promise<void>;
  abstract findByUserIdAndType(
    userId: string,
    type: TwoFactorType,
  ): Promise<TwoFactor | null>;
}
