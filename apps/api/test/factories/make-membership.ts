import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import {
  Membership,
  MembershipProps,
} from "@/domain/users/entities/membership";

export function makeMembership(
  override: Partial<MembershipProps> = {},
): Membership {
  return Membership.create({
    communityId: override.communityId ?? new UniqueEntityID(),
    userId: override.userId ?? new UniqueEntityID(),
  });
}
