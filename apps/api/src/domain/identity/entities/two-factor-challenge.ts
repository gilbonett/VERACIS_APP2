import { AggregateRoot } from "@/core/entities/aggregate-root";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import {
  TwoFactorChallengeCodeRequestEvent,
  TwoFactorChallengeCodeRequestEventProps,
} from "../events/two-factor-challenge-code-request-event";

export const MAX_ATTEMPTS = 5;

type TwoFactorChallengeStatus =
  | "PENDING"
  | "VERIFIED"
  | "EXPIRED"
  | "FAILED"
  | "CANCELLED";

export type TwoFactorChallengeProps = {
  userId: UniqueEntityID;
  twoFactorId: UniqueEntityID;
  status: TwoFactorChallengeStatus;
  codeHash: string;

  ipAddress: string | null;
  userAgent: string | null;
  deviceName: string | null;
  attemptCount: number;

  expiresAt: Date;
  verifiedAt: Date | null;

  createdAt: Date;
  updatedAt: Date | null;
};

export class TwoFactorChallenge extends AggregateRoot<TwoFactorChallengeProps> {
  get userId() {
    return this.props.userId;
  }

  get twoFactorId() {
    return this.props.twoFactorId;
  }

  get status() {
    return this.props.status;
  }

  get attemptCount() {
    return this.props.attemptCount;
  }

  get expiresAt() {
    return this.props.expiresAt;
  }

  get codeHash() {
    return this.props.codeHash;
  }

  get verifiedAt() {
    return this.props.verifiedAt;
  }

  get ipAddress() {
    return this.props.ipAddress;
  }

  get userAgent() {
    return this.props.userAgent;
  }

  get deviceName() {
    return this.props.deviceName;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  get isExpired() {
    return (
      this.props.status === "EXPIRED" || this.props.expiresAt <= new Date()
    );
  }

  get isPending() {
    return this.props.status === "PENDING";
  }

  get isFailed() {
    return (
      this.props.status === "FAILED" ||
      this.props.attemptCount >= MAX_ATTEMPTS
    );
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  public markVerified(at: Date = new Date()) {
    if (!this.isPending) return;

    this.props.status = "VERIFIED";
    this.props.verifiedAt = at;
    this.touch();
  }

  public markFailed() {
    if (!this.isPending) return;

    this.props.status = "FAILED";
    this.touch();
  }

  public verifyCode(codeHash: string): boolean {
    if (this.codeHash !== codeHash) return false;

    return true;
  }

  public markExpired() {
    if (this.props.status !== "PENDING") return;

    this.props.status = "EXPIRED";
    this.touch();
  }

  public cancel() {
    if (!this.isPending) return;

    this.props.status = "CANCELLED";
    this.touch();
  }

  public incrementAttemptCount() {
    this.props.attemptCount += 1;
    this.touch();
  }

  public canAttempt() {
    return this.props.attemptCount < MAX_ATTEMPTS;
  }

  public resetAttemptCount() {
    this.props.attemptCount = 0;
    this.touch();
  }

  public requestCodeDelivery(payload: TwoFactorChallengeCodeRequestEventProps) {
    this.addDomainEvent(new TwoFactorChallengeCodeRequestEvent(payload));
  }

  static issue(
    props: Omit<
      TwoFactorChallengeProps,
      "status" | "verifiedAt" | "createdAt" | "updatedAt"
    >,
    id?: UniqueEntityID,
  ) {
    return new TwoFactorChallenge(
      {
        ...props,
        status: "PENDING",
        verifiedAt: null,
        createdAt: new Date(),
        updatedAt: null,
      },
      id,
    );
  }

  static reconstitute(props: TwoFactorChallengeProps, id?: UniqueEntityID) {
    return new TwoFactorChallenge(props, id);
  }
}
