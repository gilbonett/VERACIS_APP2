import { Transaction } from "@/core/repositories/transaction";
import { UserRoleAssignment } from "@/domain/authorization/entities/user-role-assignment";
import { UserRoleAssignmentRepository } from "@/domain/authorization/repositories/user-role-assignment-repository";

export class InMemoryUserRoleAssignmentRepository implements UserRoleAssignmentRepository {
  public items: UserRoleAssignment[] = [];

  async create(
    assignment: UserRoleAssignment,
    tx?: Transaction,
  ): Promise<void> {
    this.items.push(assignment);
  }

  async findManyByUserId(userId: string): Promise<UserRoleAssignment[]> {
    return this.items.filter(
      (assignment) => assignment.userId.toString() === userId,
    );
  }
}
