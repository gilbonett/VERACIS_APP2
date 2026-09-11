import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { DomainEvent } from "@/core/events/domain-event";

interface PasswordResetRequestedEventPayload {
  resetId: string;
  email: string;
  token: string;
  name: string;
  emailMasked: string;
}

export class PasswordResetRequestedEvent
  implements DomainEvent<PasswordResetRequestedEventPayload>
{
  static readonly EVENT_NAME = "PasswordResetRequestedEvent";

  public readonly ocurredAt: Date;
  public readonly payload: PasswordResetRequestedEventPayload;

  constructor(payload: PasswordResetRequestedEventPayload) {
    this.ocurredAt = new Date();
    this.payload = payload;
  }

  getName(): string {
    return PasswordResetRequestedEvent.EVENT_NAME;
  }

  getAggregateId(): UniqueEntityID {
    return new UniqueEntityID(this.payload.resetId);
  }
}
