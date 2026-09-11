import { TwoFactorChallenge } from "../entities/two-factor-challenge";

export interface AttemptLimitedSecretState {
  secretHash: string;
  attempts: number;
  maxAttempts: number;
}

export type AttemptLimitedSecretVerdict =
  | { outcome: "matched" }
  | { outcome: "mismatch"; next: AttemptLimitedSecretState }
  | { outcome: "exhausted" };

export class AttemptLimitedSecretPolicy {
  static verify(
    current: TwoFactorChallenge,
    candidateCodeHash: string,
  ): AttemptLimitedSecretVerdict {
    if (!current.canAttempt()) {
      return { outcome: "exhausted" };
    }
    if (current.codeHash !== candidateCodeHash) {
      current.incrementAttemptCount();

      return {
        outcome: "mismatch",
        next: { attempts: 1, maxAttempts: 5, secretHash: current.codeHash },
      };
    }
    return { outcome: "matched" };
  }
}
