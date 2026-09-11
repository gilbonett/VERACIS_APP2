import { Notification } from "@/domain/notifications/entities/notification";

export class NotificationPresenter {
  static toHTTP(notification: Notification) {
    return {
      id: notification.id.toString(),
      scope: notification.scope,
      title: notification.title,
      content: notification.content,
      readAt: notification.readAt,
      alertId: notification.alertId?.toString() ?? null,
      authorId: notification.authorId.toString(),
      recipientId: notification.recipientId.toString(),
      createdAt: notification.createdAt,
    };
  }
}

export type NotificationHTTP = ReturnType<typeof NotificationPresenter.toHTTP>;
