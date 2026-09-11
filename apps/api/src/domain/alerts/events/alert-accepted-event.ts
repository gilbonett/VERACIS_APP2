import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { DomainEvent } from "@/core/events/domain-event";

export interface AlertAcceptedEventPayload {
  alertId: string;
  authorId: string;
  communityId: string;
  categoryId: string;
}

export class AlertAcceptedEvent implements DomainEvent<AlertAcceptedEventPayload> {
  static readonly EVENT_NAME = "AlertAcceptedEvent";

  public readonly ocurredAt: Date;
  public readonly payload: AlertAcceptedEventPayload;

  constructor(payload: AlertAcceptedEventPayload) {
    this.ocurredAt = new Date();
    this.payload = payload;
  }

  getName(): string {
    return AlertAcceptedEvent.EVENT_NAME;
  }

  getAggregateId(): UniqueEntityID {
    return new UniqueEntityID(this.payload.alertId);
  }
}
