import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { DomainEvent } from "@/core/events/domain-event";

interface UserRegisteredPayload {
  userId: string;
  name: string;
  email: string;
}

export class UserRegistered implements DomainEvent<UserRegisteredPayload> {
  static readonly EVENT_NAME = "UserRegistered";

  public readonly ocurredAt: Date;
  public readonly payload: UserRegisteredPayload;

  constructor(payload: UserRegisteredPayload) {
    this.ocurredAt = new Date();
    this.payload = payload;
  }

  getName(): string {
    return UserRegistered.EVENT_NAME;
  }

  getAggregateId(): UniqueEntityID {
    return new UniqueEntityID(this.payload.userId);
  }
}
