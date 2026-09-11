import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import {
  PasswordResetChallenge,
  PasswordResetChallengeStatus,
} from "@/domain/identity/entities/password-reset-challenge";

type Override = Partial<{
  userId: UniqueEntityID;
  status: PasswordResetChallengeStatus;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
}>;

export function makePasswordResetChallenge(
  override: Override = {},
  id: UniqueEntityID = new UniqueEntityID(),
): PasswordResetChallenge {
  return PasswordResetChallenge.reconstitute(
    {
      userId: override.userId ?? new UniqueEntityID(),
      status: override.status ?? "PENDING",
      ipAddress: override.ipAddress ?? null,
      userAgent: override.userAgent ?? null,
      expiresAt: override.expiresAt ?? new Date(Date.now() + 30 * 60 * 1000),
      consumedAt: override.consumedAt ?? null,
      createdAt: override.createdAt ?? new Date(),
      updatedAt: override.updatedAt ?? null,
    },
    id,
  );
}
