import { Membership } from "@/domain/users/entities/membership";
import { MembershipRepository } from "@/domain/users/repositories/membership-repository";

export class InMemoryMembershipRepository implements MembershipRepository {
  public items: Membership[] = [];

  async findManyByCommunityId(communityId: string): Promise<Membership[]> {
    return this.items.filter(
      (item) => item.communityId.toString() === communityId,
    );
  }

  async findManyByCommunityIdsAndLeader(
    communityIds: string[],
  ): Promise<Membership[]> {
    return this.items.filter((item) =>
      communityIds.includes(item.communityId.toString()),
    );
  }

  async findCountByCommunityId(communityId: string): Promise<number> {
    return this.items.filter(
      (item) => item.communityId.toString() === communityId,
    ).length;
  }

  async createMany(memberships: Membership[]): Promise<void> {
    this.items.push(...memberships);
  }

  async removeMany(memberships: Membership[]): Promise<void> {
    this.items = this.items.filter((item) => !memberships.includes(item));
  }
}
