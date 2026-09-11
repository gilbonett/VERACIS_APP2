import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Account } from "@/domain/identity/entities/account";
import { Account as PrismaAccount, Prisma } from "@generated/client";

export class PrismaAccountMapper {
  static toDomain(account: PrismaAccount): Account {
    return Account.reconstitute(
      {
        accountId: account.accountId,
        providerId: account.providerId,
        userId: new UniqueEntityID(account.userId),
        accessToken: account.accessToken,
        refreshToken: account.refreshToken,
        idToken: account.idToken,
        accessTokenExpiresAt: account.accessTokenExpiresAt,
        refreshTokenExpiresAt: account.refreshTokenExpiresAt,
        scope: account.scope,
        passwordHash: account.passwordHash,
        failedAttempts: account.failedAttempts,
        lockedUntil: account.lockedUntil,
        lastPasswordChangeAt: account.lastPasswordChangeAt,
        rawAssuranceClaim: account.rawAssuranceClaim,
        linkedAt: account.linkedAt,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      },
      new UniqueEntityID(account.id),
    );
  }

  static toPrisma(account: Account): Prisma.AccountUncheckedCreateInput {
    return {
      id: account.id.toString(),
      accountId: account.accountId,
      providerId: account.providerId,
      userId: account.userId.toString(),
      accessToken: account.accessToken,
      refreshToken: account.refreshToken,
      idToken: account.idToken,
      accessTokenExpiresAt: account.accessTokenExpiresAt,
      refreshTokenExpiresAt: account.refreshTokenExpiresAt,
      scope: account.scope,
      passwordHash: account.passwordHash,
      failedAttempts: account.failedAttempts,
      lockedUntil: account.lockedUntil,
      lastPasswordChangeAt: account.lastPasswordChangeAt,
      rawAssuranceClaim: account.rawAssuranceClaim,
      linkedAt: account.linkedAt,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }
}
