import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Optional } from "@/core/types/optional";

type TwoFactorMetadata = {
  secretEncrypted: string;
  algorithm: string;
  digits: number;
  period: number;
};
export type TwoFactorType = "EMAIL" | "SMS" | "TOTP";
export type TwoFactorStatus = "PENDING" | "ENABLED" | "DISABLED" | "REVOKED";

export type TwoFactorProps = {
  type: TwoFactorType;
  status: TwoFactorStatus;
  displayName: string | null;
  metadata: TwoFactorMetadata | null;
  enrolledAt: Date | null;
  verifiedAt: Date | null;
  lastUsedAt: Date | null;

  userId: UniqueEntityID;

  createdAt: Date;
  updatedAt: Date | null;
};

export class TwoFactor extends Entity<TwoFactorProps> {
  get type() {
    return this.props.type;
  }

  get status() {
    return this.props.status;
  }

  get displayName() {
    return this.props.displayName;
  }

  get enrolledAt() {
    return this.props.enrolledAt;
  }

  get verifiedAt() {
    return this.props.verifiedAt;
  }

  get lastUsedAt() {
    return this.props.lastUsedAt;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  get isPending() {
    return this.props.status === "PENDING";
  }

  get metadata(): TwoFactorMetadata | null {
    if (this.type !== "TOTP") return null;

    return this.props.metadata;
  }

  get userId() {
    return this.props.userId;
  }

  get isEnabled() {
    return this.props.status === "ENABLED";
  }

  get isDisabled() {
    return this.props.status === "DISABLED";
  }

  get isRevoked() {
    return this.props.status === "REVOKED";
  }

  get isEmail() {
    return this.type === "EMAIL";
  }

  get isTOTP() {
    return this.type === "TOTP";
  }

  get isSMS() {
    return this.type === "SMS";
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  public updateMetadata(metadata: TwoFactorMetadata) {
    if (this.type !== "TOTP") return;

    this.props.metadata = metadata;
    this.touch();
  }

  public rename(displayName: string) {
    this.props.displayName = displayName;
    this.touch();
  }

  public enroll() {
    if (this.isEnabled || this.isRevoked) return;

    this.props.status = "PENDING";
    this.props.enrolledAt = new Date();
    this.touch();
  }

  public enable() {
    // if (this.props.status !== "PENDING") return;
    if (!this.isPending) return;

    this.props.status = "ENABLED";
    this.props.verifiedAt = new Date();
    this.touch();
  }

  public disable() {
    this.props.status = "DISABLED";
    this.touch();
  }

  public revoke() {
    this.props.status = "REVOKED";
    this.touch();
  }

  public markAsUsed() {
    this.props.lastUsedAt = new Date();
    this.touch();
  }

  public reset() {
    this.props.status = "PENDING";
    this.props.metadata = null;
    this.props.verifiedAt = null;
    this.props.enrolledAt = new Date();
    this.touch();
  }

  static create(
    props: Optional<TwoFactorProps, "createdAt" | "metadata">,
    id?: UniqueEntityID,
  ) {
    return new TwoFactor(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        status: props.status ?? "PENDING",
        metadata: props.metadata ?? null,
      },
      id,
    );
  }

  static reconstitute(props: TwoFactorProps, id?: UniqueEntityID) {
    return new TwoFactor(props, id);
  }
}
