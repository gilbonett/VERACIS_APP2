import { Transaction } from "@/core/repositories/transaction";
import { UserRoleAssignment } from "../entities/user-role-assignment";

export abstract class UserRoleAssignmentRepository {
  abstract create(
    assignment: UserRoleAssignment,
    tx?: Transaction,
  ): Promise<void>;
  abstract findManyByUserId(userId: string): Promise<UserRoleAssignment[]>;
}
