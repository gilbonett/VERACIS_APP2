import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { AlertComment } from "@/domain/alerts/entities/alert-comment";
import { Prisma, AlertComment as PrismaAlertComment } from "@generated/client";

export class PrismaAlertCommentMapper {
  static toDomain(raw: PrismaAlertComment): AlertComment {
    return AlertComment.create(
      {
        content: raw.content,
        authorId: new UniqueEntityID(raw.authorId),
        alertId: new UniqueEntityID(raw.alertId),
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPrisma(
    props: AlertComment,
  ): Prisma.AlertCommentUncheckedCreateInput {
    return {
      id: props.id.toString(),
      content: props.content,
      authorId: props.authorId.toString(),
      alertId: props.alertId.toString(),
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }
}
