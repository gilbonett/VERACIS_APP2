import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";

type UserTermsProps = {
  userId: UniqueEntityID;
  termsId: UniqueEntityID;
  acceptedAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
};

export class UserTerms extends Entity<UserTermsProps> {
  get userId() {
    return this.props.userId;
  }

  get termsId() {
    return this.props.termsId;
  }

  get acceptedAt() {
    return this.props.acceptedAt;
  }

  get ipAddress() {
    return this.props.ipAddress;
  }

  get userAgent() {
    return this.props.userAgent;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  static create(
    userId: UniqueEntityID,
    termsId: UniqueEntityID,
    ipAddress?: string | null,
    userAgent?: string | null,
  ): UserTerms {
    const now = new Date();
    return new UserTerms({
      userId,
      termsId,
      ipAddress,
      userAgent,
      acceptedAt: now,
      createdAt: now,
    });
  }
}
