import { Transaction } from "@/core/repositories/transaction";
import { Membership } from "../entities/membership";

export abstract class MembershipRepository {
  abstract findManyByCommunityId(communityId: string): Promise<Membership[]>;
  abstract findManyByCommunityIdsAndLeader(
    communityIds: string[],
  ): Promise<Membership[]>;
  abstract findCountByCommunityId(communityId: string): Promise<number>;
  abstract createMany(
    memberships: Membership[],
    tx?: Transaction,
  ): Promise<void>;
  abstract removeMany(
    memberships: Membership[],
    tx?: Transaction,
  ): Promise<void>;
}
