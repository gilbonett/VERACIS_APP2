import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Slug } from "@/core/value-objects/slug";
import {
  Role,
  RoleProps,
  RoleStatus,
} from "@/domain/authorization/entities/role";

export function makeRole(
  override: Partial<RoleProps> = {},
  id?: UniqueEntityID,
): Role {
  return Role.create(
    {
      name: override.name ?? "Member Community",
      slug: override.slug ?? Slug.createFromText("member-community"),
      description: override.description ?? null,
      status: override.status ?? RoleStatus.ACTIVE,
      crestedAt: override.crestedAt ?? new Date(),
      updatedAt: override.updatedAt ?? null,
    },
    id,
  );
}
