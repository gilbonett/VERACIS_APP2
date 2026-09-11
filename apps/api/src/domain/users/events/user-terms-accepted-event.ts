import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { DomainEvent } from "@/core/events/domain-event";

interface UserTermsAcceptedEventPayload {
  userId: string;
  termsId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class UserTermsAcceptedEvent
  implements DomainEvent<UserTermsAcceptedEventPayload>
{
  static readonly EVENT_NAME = "UserTermsAcceptedEvent";

  public readonly ocurredAt: Date;
  public readonly payload: UserTermsAcceptedEventPayload;

  constructor(payload: UserTermsAcceptedEventPayload) {
    this.ocurredAt = new Date();
    this.payload = payload;
  }

  getName(): string {
    return UserTermsAcceptedEvent.EVENT_NAME;
  }

  getAggregateId(): UniqueEntityID {
    return new UniqueEntityID(this.payload.userId);
  }
}
