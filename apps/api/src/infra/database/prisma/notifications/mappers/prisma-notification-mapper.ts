import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Notification } from "@/domain/notifications/entities/notification";
import { Prisma, Notification as PrismaNotification } from "@generated/client";

export class PrismaNotificationMapper {
  static toDomain(raw: PrismaNotification): Notification {
    return Notification.reconstitute(
      {
        scope: raw.scope,
        title: raw.title,
        content: raw.content,
        readAt: raw.readAt,
        alertId: raw.alertId ? new UniqueEntityID(raw.alertId) : null,
        authorId: new UniqueEntityID(raw.authorId),
        recipientId: new UniqueEntityID(raw.recipientId),
        createdAt: raw.createdAt,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPrisma(data: Notification): Prisma.NotificationUncheckedCreateInput {
    return {
      id: data.id.toString(),
      scope: data.scope,
      title: data.title,
      content: data.content,
      readAt: data.readAt,
      alertId: data.alertId ? data.alertId.toString() : null,
      authorId: data.authorId.toString(),
      recipientId: data.recipientId.toString(),
      createdAt: data.createdAt,
    };
  }
}
