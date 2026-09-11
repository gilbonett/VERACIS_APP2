import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { DomainEvent } from "@/core/events/domain-event";

interface PasswordChangedEventPayload {
  userId: string;
}

export class PasswordChangedEvent
  implements DomainEvent<PasswordChangedEventPayload>
{
  static readonly EVENT_NAME = "PasswordChangedEvent";

  public readonly ocurredAt: Date;
  public readonly payload: PasswordChangedEventPayload;

  constructor(payload: PasswordChangedEventPayload) {
    this.ocurredAt = new Date();
    this.payload = payload;
  }

  getName(): string {
    return PasswordChangedEvent.EVENT_NAME;
  }

  getAggregateId(): UniqueEntityID {
    return new UniqueEntityID(this.payload.userId);
  }
}
