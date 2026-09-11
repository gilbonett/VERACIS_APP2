import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";

export interface MembershipProps {
  userId: UniqueEntityID;
  communityId: UniqueEntityID;
  communityName?: string;
  biomeName?: string;
}

export class Membership extends Entity<MembershipProps> {
  get userId() {
    return this.props.userId;
  }

  get communityId() {
    return this.props.communityId;
  }

  get communityName() {
    return this.props.communityName;
  }

  get biomeName() {
    return this.props.biomeName;
  }

  static create(props: Omit<MembershipProps, "communityName" | "biomeName">) {
    return new Membership(props);
  }

  static reconstitute(props: MembershipProps) {
    return new Membership(props);
  }
}
