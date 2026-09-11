import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";

export const SCOPE_TYPES = ["communityId", "biomaId"] as const;
export type ScopeType = (typeof SCOPE_TYPES)[number];

type UserRoleAssignmentProps = {
  userId: UniqueEntityID;
  roleId: UniqueEntityID;
  scopeType: ScopeType | null;
  scopeValue: string | null;
  assignedByUserId: UniqueEntityID | null;
  assignedAt: Date;
};

export class UserRoleAssignment extends Entity<UserRoleAssignmentProps> {
  get userId() {
    return this.props.userId;
  }

  get roleId() {
    return this.props.roleId;
  }

  get scopeType() {
    return this.props.scopeType;
  }

  get scopeValue() {
    return this.props.scopeValue;
  }

  get assignedByUserId() {
    return this.props.assignedByUserId;
  }

  get assignedAt() {
    return this.props.assignedAt;
  }

  changeRole(newRoleId: UniqueEntityID) {
    if (this.props.roleId.equals(newRoleId)) return;

    this.props.roleId = newRoleId;
  }

  static create(props: UserRoleAssignmentProps, id?: UniqueEntityID) {
    return new UserRoleAssignment(props, id);
  }
}
