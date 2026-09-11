import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Optional } from "@/core/types/optional";
import { Slug } from "@/core/value-objects/slug";
import { RolePermissionList } from "./role-permission-list";

export enum RoleStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export type RoleProps = {
  status: RoleStatus;
  name: string;
  slug: Slug;
  description: string | null;

  crestedAt: Date;
  updatedAt: Date | null;

  permissions: RolePermissionList;
};

export class Role extends Entity<RoleProps> {
  get status() {
    return this.props.status;
  }

  get name() {
    return this.props.name;
  }

  get slug() {
    return this.props.slug;
  }

  get description() {
    return this.props.description;
  }

  get createdAt() {
    return this.props.crestedAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  get permissions() {
    return this.props.permissions;
  }

  set permissions(permissions: RolePermissionList) {
    this.props.permissions = permissions;
  }

  static create(
    props: Optional<RoleProps, "permissions">,
    id?: UniqueEntityID,
  ) {
    return new Role(
      {
        ...props,
        permissions: props.permissions ?? new RolePermissionList(),
      },
      id,
    );
  }
}
