import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Notification } from "@/domain/notifications/entities/notification";
import { NotificationsCreatedEvent } from "@/domain/notifications/events/notifications-created-event";
import { NotificationProvider } from "@/infra/realtime/notification/notification-provider";
import { ConnectionRegistry } from "@/infra/realtime/presence/connection-registry";
import { Injectable } from "@nestjs/common";
import { OnEvent } from "../shared";

const NOTIFICATIONS_CHANNEL = "notifications";

@Injectable()
export class OnNotificationsCreated {
  constructor(
    private notificationProvider: NotificationProvider,
    private connectionRegistry: ConnectionRegistry,
  ) {}

  @OnEvent(NotificationsCreatedEvent)
  async handle({ payload }: NotificationsCreatedEvent) {
    for (const item of payload.notifications) {
      const isConnected = await this.connectionRegistry.isConnected(
        NOTIFICATIONS_CHANNEL,
        item.recipientId,
      );

      if (isConnected) {
        const notification = Notification.reconstitute(
          {
            scope: item.scope,
            title: item.title,
            content: item.content,
            readAt: null,
            alertId: item.alertId ? new UniqueEntityID(item.alertId) : null,
            authorId: new UniqueEntityID(item.authorId),
            recipientId: new UniqueEntityID(item.recipientId),
            createdAt: new Date(),
          },
          new UniqueEntityID(item.notificationId),
        );

        this.notificationProvider.publish(notification);
      }
    }
  }
}
