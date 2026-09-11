import { UserRoleAssignmentRepository } from "@/domain/authorization/repositories/user-role-assignment-repository";

export async function resolveRoleClaims(
  userRoleAssignmentRepository: UserRoleAssignmentRepository,
  userId: string,
) {
  const assignments =
    await userRoleAssignmentRepository.findManyByUserId(userId);

  return assignments.map((assignment) => ({
    roleId: assignment.roleId.toString(),
    scopeType: assignment.scopeType,
    scopeValue: assignment.scopeValue,
  }));
}
