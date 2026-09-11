import { AggregateRoot } from "@/core/entities/aggregate-root";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { PasswordResetRequestedEvent } from "../events/password-reset-requested-event";

export type PasswordResetChallengeStatus =
  | "PENDING"
  | "CONSUMED"
  | "EXPIRED"
  | "FAILED"
  | "CANCELLED";

type PasswordResetChallengeProps = {
  userId: UniqueEntityID;
  status: PasswordResetChallengeStatus;
  tokenHash: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceName: string | null;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
};

export class PasswordResetChallenge extends AggregateRoot<PasswordResetChallengeProps> {
  get userId() {
    return this.props.userId;
  }

  get status() {
    return this.props.status;
  }

  get tokenHash() {
    return this.props.tokenHash;
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

  get expiresAt() {
    return this.props.expiresAt;
  }

  get consumedAt() {
    return this.props.consumedAt;
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

  private touch() {
    this.props.updatedAt = new Date();
  }

  public markConsumed(at: Date = new Date()) {
    if (!this.isPending) return;
    this.props.status = "CONSUMED";
    this.props.consumedAt = at;
    this.touch();
  }

  public markFailed() {
    if (!this.isPending) return;
    this.props.status = "FAILED";
    this.touch();
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

  public requestResetDelivery(email: string, opaqueToken: string) {
    this.addDomainEvent(
      new PasswordResetRequestedEvent(this.id, {
        userId: this.props.userId.toString(),
        email,
        token: opaqueToken,
      }),
    );
  }
  static issue(
    props: Omit<
      PasswordResetChallengeProps,
      "status" | "consumedAt" | "createdAt" | "updatedAt"
    >,
    id?: UniqueEntityID,
  ) {
    return new PasswordResetChallenge(
      {
        ...props,
        status: "PENDING",
        consumedAt: null,
        createdAt: new Date(),
        updatedAt: null,
      },
      id,
    );
  }

  static reconstitute(props: PasswordResetChallengeProps, id: UniqueEntityID) {
    return new PasswordResetChallenge(props, id);
  }
}
