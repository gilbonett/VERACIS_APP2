import { TwoFactorChallenge } from "../entities/two-factor-challenge";

export abstract class TwoFactorChallengeRepository {
  abstract create(data: TwoFactorChallenge): Promise<void>;
  abstract findById(id: string): Promise<TwoFactorChallenge | null>;
  abstract save(data: TwoFactorChallenge): Promise<void>;
}
