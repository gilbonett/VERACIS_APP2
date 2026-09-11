import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { AlertReaction } from "@/domain/alerts/entities/alert-reaction";
import {
  Prisma,
  AlertReaction as PrismaAlertReaction,
} from "@generated/client";

export class PrismaAlertReactionMapper {
  static toDomain(raw: PrismaAlertReaction): AlertReaction {
    return AlertReaction.reconstitute(
      {
        type: raw.type,
        authorId: new UniqueEntityID(raw.authorId),
        alertId: new UniqueEntityID(raw.alertId),
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPrisma(
    props: AlertReaction,
  ): Prisma.AlertReactionUncheckedCreateInput {
    return {
      id: props.id.toString(),
      type: props.type,
      authorId: props.authorId.toString(),
      alertId: props.alertId.toString(),
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }
}
