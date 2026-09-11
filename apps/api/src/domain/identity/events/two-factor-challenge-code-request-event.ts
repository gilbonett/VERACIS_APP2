import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { DomainEvent } from "@/core/events/domain-event";

export interface TwoFactorChallengeCodeRequestEventProps {
  userId: string;
  twoFactorId: string;
  twoFactorType: string;
  twoFactorChallengeId: string;
  destination: string;
  code: string;
}

export class TwoFactorChallengeCodeRequestEvent implements DomainEvent<TwoFactorChallengeCodeRequestEventProps> {
  static readonly EVENT_NAME = "TwoFactorChallengeCodeRequestEvent";

  public readonly ocurredAt: Date;
  public readonly payload: TwoFactorChallengeCodeRequestEventProps;

  constructor(payload: TwoFactorChallengeCodeRequestEventProps) {
    this.payload = payload;
    this.ocurredAt = new Date();
  }

  getName(): string {
    return TwoFactorChallengeCodeRequestEvent.EVENT_NAME;
  }

  getAggregateId(): UniqueEntityID {
    return new UniqueEntityID(this.payload.twoFactorChallengeId);
  }
}
