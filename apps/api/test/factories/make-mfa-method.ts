import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import {
  MfaMethod,
  MfaMethodProps,
} from "@/domain/authentication/entities/mfa-method";

export function makeMfaMethod(
  override: Partial<MfaMethodProps> = {},
  id?: UniqueEntityID,
): MfaMethod {
  return MfaMethod.build(
    {
      userId: override.userId ?? new UniqueEntityID(),
      type: "OTP_EMAIL",
      secretData: null,
      enabled: true,
      isDefault: true,
      lastUsedAt: null,
      createdAt: new Date(),
      updatedAt: null,
    },
    id,
  );
}
