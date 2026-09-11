import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { SessionToken } from '@/domain/identity/entities/session-token'
import { Prisma, SessionToken as PrismaSessionToken } from '@generated/client'

export class PrismaSessionTokenMapper {
  static toDomain(token: PrismaSessionToken): SessionToken {
    return SessionToken.create(
      {
        sessionId: new UniqueEntityID(token.sessionId),
        version: token.version,
        tokenHash: token.tokenHash,
        consumedAt: token.consumedAt,
        replacedByVersion: token.replacedByVersion,
        createdAt: token.createdAt,
      },
      new UniqueEntityID(token.id),
    )
  }

  static toPrisma(
    token: SessionToken,
  ): Prisma.SessionTokenUncheckedCreateInput {
    return {
      id: token.id.toString(),
      sessionId: token.sessionId.toString(),
      version: token.version,
      tokenHash: token.tokenHash,
      consumedAt: token.consumedAt,
      replacedByVersion: token.replacedByVersion,
      createdAt: token.createdAt,
    }
  }
}
