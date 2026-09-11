import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Membership } from "@/domain/users/entities/membership";
import { Prisma, Membership as PrismaMembership } from "@generated/client";

export class PrismaMembershipMapper {
  static toDomain(membership: PrismaMembership): Membership {
    return Membership.reconstitute({
      communityId: new UniqueEntityID(membership.communityId),
      userId: new UniqueEntityID(membership.userId),
    });
  }

  static toPrismaMany(
    membership: Membership,
  ): Prisma.MembershipUncheckedCreateInput {
    return {
      communityId: membership.communityId.toString(),
      userId: membership.userId.toString(),
    };
  }
}
