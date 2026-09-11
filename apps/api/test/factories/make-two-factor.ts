import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import {
  TwoFactor,
  TwoFactorProps,
} from "@/domain/identity/entities/two-factor";

export function makeTwoFactor(
  override: Partial<TwoFactorProps> = {},
  id?: UniqueEntityID,
): TwoFactor {
  return TwoFactor.create(
    {
      displayName: override.displayName ?? null,
      type: override.type ?? "EMAIL",
      status: override.status ?? "ENABLED",
      userId: override.userId ?? new UniqueEntityID(),
      enrolledAt: override.enrolledAt ?? null,
      verifiedAt: override.verifiedAt ?? new Date(),
      lastUsedAt: override.lastUsedAt ?? null,
      createdAt: override.createdAt ?? new Date(),
      updatedAt: override.updatedAt ?? null,
      metadata: override.metadata ?? null,
    },
    id,
  );
}
