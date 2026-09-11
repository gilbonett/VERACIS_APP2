import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";

type RolePermissionProps = {
  roleId: UniqueEntityID;
  permissionId: UniqueEntityID;
};

export class RolePermission extends Entity<RolePermissionProps> {
  get roleId() {
    return this.props.roleId;
  }

  get permissionId() {
    return this.props.permissionId;
  }

  static create(props: RolePermissionProps) {
    return new RolePermission(props);
  }
}
