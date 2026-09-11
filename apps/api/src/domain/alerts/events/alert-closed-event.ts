import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { DomainEvent } from "@/core/events/domain-event";

interface AlertClosedEventPayload {
  alertId: string;
  closedAt: Date;
}

export class AlertClosedEvent implements DomainEvent<AlertClosedEventPayload> {
  static readonly EVENT_NAME = "AlertClosedEvent";

  public ocurredAt: Date;
  public readonly payload: AlertClosedEventPayload;

  constructor(payload: AlertClosedEventPayload) {
    this.ocurredAt = new Date();
    this.payload = payload;
  }

  getName(): string {
    return AlertClosedEvent.EVENT_NAME;
  }

  getAggregateId(): UniqueEntityID {
    return new UniqueEntityID(this.payload.alertId);
  }
}
