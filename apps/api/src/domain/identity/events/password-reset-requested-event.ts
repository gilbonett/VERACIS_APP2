import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { DomainEvent } from "@/core/events/domain-event";

export interface PasswordResetRequestedEventProps {
  userId: string;
  email: string;
  token: string;
}

export class PasswordResetRequestedEvent
  implements DomainEvent<PasswordResetRequestedEventProps>
{
  static readonly EVENT_NAME = "PasswordResetRequestedEvent";

  public readonly ocurredAt: Date;
  public readonly payload: PasswordResetRequestedEventProps;

  constructor(
    private readonly aggregateId: UniqueEntityID,
    payload: PasswordResetRequestedEventProps,
  ) {
    this.payload = payload;
    this.ocurredAt = new Date();
  }

  getAggregateId(): UniqueEntityID {
    return this.aggregateId;
  }

  getName(): string {
    return PasswordResetRequestedEvent.EVENT_NAME;
  }
}
