import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Session } from "@/domain/auth/entities/session";
import { Prisma, Session as PrismaSession } from "@generated/client";

export class PrismaSessionMapper {
  static toDomain(raw: PrismaSession): Session {
    return Session.reconstitute(
      {
        userId: new UniqueEntityID(raw.userId),
        expiresAt: raw.expiresAt,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        userAgent: raw.userAgent,
        ipAddress: raw.ipAddress,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPrisma(session: Session): Prisma.SessionUncheckedCreateInput {
    return {
      id: session.id.toString(),
      userId: session.userId.toString(),
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
    };
  }
}
