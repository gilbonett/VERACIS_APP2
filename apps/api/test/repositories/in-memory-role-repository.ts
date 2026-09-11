import { Role } from "@/domain/authorization/entities/role";
import { RoleRepository } from "@/domain/authorization/repositories/role-repository";

export class InMemoryRoleRepository extends RoleRepository {
  public items: Role[] = [];

  async findBySlug(slug: string): Promise<Role | null> {
    const role = this.items.find((role) => role.slug.value === slug);
    return role ?? null;
  }
}
