import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Session } from '@/domain/identity/entities/session'
import { Prisma, Session as PrismaSession } from '@generated/client'

export class PrismaSessionMapper {
  static toDomain(session: PrismaSession): Session {
    return Session.create(
      {
        deviceName: session.deviceName,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        authenticatedAt: session.authenticatedAt,
        lastActivityAt: session.lastActivityAt,
        expiresAt: session.expiresAt,
        revokedAt: session.revokedAt,
        revokeReason: session.revokeReason,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        assuranceLevel: session.assuranceLevel,
        userId: new UniqueEntityID(session.userId),
      },
      new UniqueEntityID(session.id),
    )
  }

  static toPrisma(session: Session): Prisma.SessionUncheckedCreateInput {
    return {
      id: session.id.toString(),
      deviceName: session.deviceName,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      authenticatedAt: session.authenticatedAt,
      lastActivityAt: session.lastActivityAt,
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt,
      revokeReason: session.revokeReason,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      assuranceLevel: session.assuranceLevel,
      userId: session.userId.toString(),
    }
  }
}
