import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import {
  Account,
  AccountProps,
  CREDENTIAL_PROVIDER_ID,
} from "@/domain/identity/entities/account";

export function makeCredentialAccount(
  override: Partial<AccountProps> = {},
  userId?: UniqueEntityID,
): Account {
  const uid = userId ?? override.userId ?? new UniqueEntityID();

  return Account.reconstitute(
    {
      accountId: override.accountId ?? uid.toString(),
      providerId: override.providerId ?? CREDENTIAL_PROVIDER_ID,
      userId: uid,
      accessToken: override.accessToken ?? null,
      refreshToken: override.refreshToken ?? null,
      idToken: override.idToken ?? null,
      accessTokenExpiresAt: override.accessTokenExpiresAt ?? null,
      refreshTokenExpiresAt: override.refreshTokenExpiresAt ?? null,
      scope: override.scope ?? null,
      passwordHash: override.passwordHash ?? "hashed-password",
      failedAttempts: override.failedAttempts ?? 0,
      lockedUntil: override.lockedUntil ?? null,
      lastPasswordChangeAt: override.lastPasswordChangeAt ?? new Date(),
      rawAssuranceClaim: override.rawAssuranceClaim ?? null,
      linkedAt: override.linkedAt ?? null,
      createdAt: override.createdAt ?? new Date(),
      updatedAt: override.updatedAt ?? new Date(),
    },
    new UniqueEntityID(),
  );
}

export function makeFederatedAccount(
  override: Partial<AccountProps> = {},
  id?: UniqueEntityID,
): Account {
  return Account.reconstitute(
    {
      accountId: override.accountId ?? "provider-subject-01",
      providerId: override.providerId ?? new UniqueEntityID().toString(),
      userId: override.userId ?? new UniqueEntityID(),
      accessToken: override.accessToken ?? null,
      refreshToken: override.refreshToken ?? null,
      idToken: override.idToken ?? null,
      accessTokenExpiresAt: override.accessTokenExpiresAt ?? null,
      refreshTokenExpiresAt: override.refreshTokenExpiresAt ?? null,
      scope: override.scope ?? null,
      passwordHash: override.passwordHash ?? null,
      failedAttempts: override.failedAttempts ?? null,
      lockedUntil: override.lockedUntil ?? null,
      lastPasswordChangeAt: override.lastPasswordChangeAt ?? null,
      rawAssuranceClaim: override.rawAssuranceClaim ?? null,
      linkedAt: override.linkedAt ?? new Date(),
      createdAt: override.createdAt ?? new Date(),
      updatedAt: override.updatedAt ?? null,
    },
    id ?? new UniqueEntityID(),
  );
}
