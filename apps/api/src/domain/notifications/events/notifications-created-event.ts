import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { DomainEvent } from "@/core/events/domain-event";
import { NotificationScope } from "../entities/notification";

interface NotificationsCreatedEventPayload {
  notifications: {
    notificationId: string;
    scope: NotificationScope;
    title: string;
    content: string;
    authorId: string;
    recipientId: string;
    alertId?: string | null;
  }[];
}

export class NotificationsCreatedEvent
  implements DomainEvent<NotificationsCreatedEventPayload>
{
  static readonly EVENT_NAME = "NotificationsCreatedEvent";

  public readonly ocurredAt: Date;
  public readonly payload: NotificationsCreatedEventPayload;

  constructor(payload: NotificationsCreatedEventPayload) {
    this.ocurredAt = new Date();
    this.payload = payload;
  }

  getName(): string {
    return NotificationsCreatedEvent.EVENT_NAME;
  }

  getAggregateId(): UniqueEntityID {
    return new UniqueEntityID(this.payload.notifications[0].notificationId);
  }
}
