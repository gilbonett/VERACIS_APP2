import { Role } from "../entities/role";

export abstract class RoleRepository {
  abstract findBySlug(slug: string): Promise<Role | null>;
}
