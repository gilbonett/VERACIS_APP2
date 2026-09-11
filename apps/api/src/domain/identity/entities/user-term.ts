import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";

type UserTermProps = {
  userId: UniqueEntityID;
  termsId: UniqueEntityID;
  acceptedAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
};

export class UserTerm extends Entity<UserTermProps> {
  get userId() {
    return this.props.userId;
  }

  get termsId() {
    return this.props.termsId;
  }

  get acceptedAt() {
    return this.props.acceptedAt;
  }

  // get ipAddress() {
  //   return this.props.ipAddress;
  // }

  // get userAgent() {
  //   return this.props.userAgent;
  // }

  get createdAt() {
    return this.props.createdAt;
  }
}
