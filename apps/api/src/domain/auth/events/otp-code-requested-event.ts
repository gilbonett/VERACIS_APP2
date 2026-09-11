import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { DomainEvent } from "@/core/events/domain-event";

interface OtpCodeRequestedEventPayload {
  challengeId: string;
  email: string;
  code: string;
  name: string;
}

export class OtpCodeRequestedEvent
  implements DomainEvent<OtpCodeRequestedEventPayload>
{
  static readonly EVENT_NAME = "OtpCodeRequestedEvent";

  public readonly ocurredAt: Date;
  public readonly payload: OtpCodeRequestedEventPayload;

  constructor(payload: OtpCodeRequestedEventPayload) {
    this.ocurredAt = new Date();
    this.payload = payload;
  }

  getName(): string {
    return OtpCodeRequestedEvent.EVENT_NAME;
  }

  getAggregateId(): UniqueEntityID {
    return new UniqueEntityID(this.payload.challengeId);
  }
}
