import { left } from "@/core/either";
import { AggregateRoot } from "@/core/entities/aggregate-root";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { NotificationNotAllowedError } from "../errors/notification-not-allowed-error";
import { NotificationCreatedEvent } from "../events/notification-created-event";
import { NotificationsCreatedEvent } from "../events/notifications-created-event";

export type NotificationScope = "ALERT" | "USER";

interface NotificationProps {
  scope: NotificationScope;
  title: string;
  content: string;
  readAt?: Date | null;
  alertId?: UniqueEntityID | null;
  authorId: UniqueEntityID;
  recipientId: UniqueEntityID;
  createdAt: Date;
}

export class Notification extends AggregateRoot<NotificationProps> {
  get scope() {
    return this.props.scope;
  }

  get title() {
    return this.props.title;
  }

  get content() {
    return this.props.content;
  }

  get readAt() {
    return this.props.readAt;
  }

  get alertId() {
    return this.props.alertId;
  }

  get authorId() {
    return this.props.authorId;
  }

  get recipientId() {
    return this.props.recipientId;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  read(recipientId: string) {
    if (recipientId !== this.props.recipientId.toString()) {
      return left(new NotificationNotAllowedError());
    }

    this.props.readAt = new Date();
  }

  static create(
    props: Omit<NotificationProps, "createdAt" | "readAt">,
  ): Notification {
    const notification = new Notification({
      ...props,
      readAt: null,
      createdAt: new Date(),
    });

    notification.addDomainEvent(
      new NotificationCreatedEvent({
        notificationId: notification.id.toString(),
        scope: notification.scope,
        title: notification.title,
        content: notification.content,
        authorId: notification.authorId.toString(),
        recipientId: notification.recipientId.toString(),
        alertId: notification.alertId?.toString() ?? null,
      }),
    );

    return notification;
  }

  static createMany(
    props: Omit<NotificationProps, "createdAt" | "readAt">[],
  ): Notification[] {
    const notifications = props.map(
      (item) =>
        new Notification({ ...item, readAt: null, createdAt: new Date() }),
    );

    if (notifications.length > 0) {
      notifications[0].addDomainEvent(
        new NotificationsCreatedEvent({
          notifications: notifications.map((notification) => ({
            notificationId: notification.id.toString(),
            scope: notification.scope,
            title: notification.title,
            content: notification.content,
            authorId: notification.authorId.toString(),
            recipientId: notification.recipientId.toString(),
            alertId: notification.alertId?.toString() ?? null,
          })),
        }),
      );
    }

    return notifications;
  }

  static reconstitute(
    props: NotificationProps,
    id?: UniqueEntityID,
  ): Notification {
    const notification = new Notification(props, id);
    return notification;
  }
}
