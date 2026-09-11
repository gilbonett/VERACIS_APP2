import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { PasswordReset } from "@/domain/auth/entities/password-reset";
import {
  Prisma,
  PasswordReset as PrismaPasswordReset,
} from "@generated/client";

export class PrismaPasswordResetMapper {
  static toDomain(raw: PrismaPasswordReset): PasswordReset {
    return PasswordReset.reconstitute(
      {
        userId: new UniqueEntityID(raw.userId),
        email: raw.email,
        expiresAt: raw.expiresAt,
        usedAt: raw.usedAt,
        createdAt: raw.createdAt,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPrisma(
    reset: PasswordReset,
  ): Prisma.PasswordResetUncheckedCreateInput {
    return {
      id: reset.id.toString(),
      userId: reset.userId.toString(),
      email: reset.email,
      expiresAt: reset.expiresAt,
      usedAt: reset.usedAt,
      createdAt: reset.createdAt,
    };
  }
}
