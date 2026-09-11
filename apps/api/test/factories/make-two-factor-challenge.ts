import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import {
  TwoFactorChallenge,
  TwoFactorChallengeProps,
} from "@/domain/identity/entities/two-factor-challenge";

export function makeTwoFactorChallenge(
  override: Partial<TwoFactorChallengeProps> = {},
  id?: UniqueEntityID,
): TwoFactorChallenge {
  return TwoFactorChallenge.reconstitute(
    {
      status: override.status ?? "PENDING",
      codeHash: override.codeHash ?? "hashed-code",
      attemptCount: override.attemptCount ?? 0,
      twoFactorId: override.twoFactorId ?? new UniqueEntityID(),
      userId: override.userId ?? new UniqueEntityID(),
      ipAddress: override.ipAddress ?? null,
      userAgent: override.userAgent ?? null,
      deviceName: override.deviceName ?? null,
      expiresAt: override.expiresAt ?? new Date(),
      verifiedAt: override.verifiedAt ?? null,
      createdAt: override.createdAt ?? new Date(),
      updatedAt: override.updatedAt ?? null,
    },
    id,
  );
}
