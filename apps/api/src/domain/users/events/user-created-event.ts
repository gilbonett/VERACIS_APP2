import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { DomainEvent } from "@/core/events/domain-event";

interface UserCreatedEventPayload {
  userId: string;
  name: string;
  communityIds: string[];
}

export class UserCreatedEvent implements DomainEvent<UserCreatedEventPayload> {
  static readonly EVENT_NAME = "UserCreatedEvent";

  public readonly ocurredAt: Date;
  public readonly payload: UserCreatedEventPayload;

  constructor(payload: UserCreatedEventPayload) {
    this.ocurredAt = new Date();
    this.payload = payload;
  }

  getName(): string {
    return UserCreatedEvent.EVENT_NAME;
  }

  getAggregateId(): UniqueEntityID {
    return new UniqueEntityID(this.payload.userId);
  }
}
