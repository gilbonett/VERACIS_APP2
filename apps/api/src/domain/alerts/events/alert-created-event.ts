import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { DomainEvent } from "@/core/events/domain-event";
import { AlertStatus } from "../entities/alert";

interface AlertCreatedEventPayload {
  alertId: string;
  authorId: string;
  communityId: string;
  status: AlertStatus;
  categoryId: string;
}

export class AlertCreatedEvent implements DomainEvent<AlertCreatedEventPayload> {
  static readonly EVENT_NAME = "AlertCreatedEvent";

  public readonly ocurredAt: Date;
  public readonly payload: AlertCreatedEventPayload;

  constructor(payload: AlertCreatedEventPayload) {
    this.ocurredAt = new Date();
    this.payload = payload;
  }

  getAggregateId(): UniqueEntityID {
    return new UniqueEntityID(this.payload.alertId);
  }

  getName(): string {
    return AlertCreatedEvent.EVENT_NAME;
  }
}
