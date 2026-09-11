import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { DomainEvent } from "@/core/events/domain-event";
import { NotificationScope } from "../entities/notification";

interface NotificationCreatedEventPayload {
  notificationId: string;
  scope: NotificationScope;
  title: string;
  content: string;
  authorId: string;
  recipientId: string;
  alertId?: string | null;
}

export class NotificationCreatedEvent
  implements DomainEvent<NotificationCreatedEventPayload>
{
  static readonly EVENT_NAME = "NotificationCreatedEvent";

  public readonly ocurredAt: Date;
  public readonly payload: NotificationCreatedEventPayload;

  constructor(payload: NotificationCreatedEventPayload) {
    this.ocurredAt = new Date();
    this.payload = payload;
  }

  getName(): string {
    return NotificationCreatedEvent.EVENT_NAME;
  }

  getAggregateId(): UniqueEntityID {
    return new UniqueEntityID(this.payload.notificationId);
  }
}
