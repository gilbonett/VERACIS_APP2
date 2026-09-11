import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Notification } from "@/domain/notifications/entities/notification";
import { NotificationCreatedEvent } from "@/domain/notifications/events/notification-created-event";
import { NotificationProvider } from "@/infra/realtime/notification/notification-provider";
import { ConnectionRegistry } from "@/infra/realtime/presence/connection-registry";
import { Injectable } from "@nestjs/common";
import { OnEvent } from "../shared";

const NOTIFICATIONS_CHANNEL = "notifications";

@Injectable()
export class OnNotificationCreated {
  constructor(
    private notificationProvider: NotificationProvider,
    private connectionRegistry: ConnectionRegistry,
  ) {}

  @OnEvent(NotificationCreatedEvent, (event, self: OnNotificationCreated) =>
    self.guard(event.recipientId),
  )
  async handle({ payload }: NotificationCreatedEvent) {
    const notification = Notification.reconstitute(
      {
        scope: payload.scope,
        title: payload.title,
        content: payload.content,
        readAt: null,
        alertId: payload.alertId ? new UniqueEntityID(payload.alertId) : null,
        authorId: new UniqueEntityID(payload.authorId),
        recipientId: new UniqueEntityID(payload.recipientId),
        createdAt: new Date(),
      },
      new UniqueEntityID(payload.notificationId),
    );

    this.notificationProvider.publish(notification);
  }

  private guard(recipientId: string) {
    return this.connectionRegistry.isConnected(
      NOTIFICATIONS_CHANNEL,
      recipientId,
    );
  }
}
