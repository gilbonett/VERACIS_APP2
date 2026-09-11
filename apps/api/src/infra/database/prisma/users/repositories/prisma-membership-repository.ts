import { Injectable } from "@nestjs/common";

import { Transaction } from "@/core/repositories/transaction";
import { Membership } from "@/domain/users/entities/membership";
import { MembershipRepository } from "@/domain/users/repositories/membership-repository";
import { TransactionClient } from "@generated/internal/prismaNamespace";
import { PrismaService } from "../../prisma.service";
import { PrismaMembershipMapper } from "../mappers/prisma-user-membership-mapper";

@Injectable()
export class PrismaMembershipRepository implements MembershipRepository {
  constructor(private prisma: PrismaService) {}

  async findManyByCommunityIdsAndLeader(
    communityIds: string[],
  ): Promise<Membership[]> {
    const data = await this.prisma.membership.findMany({
      where: {
        communityId: {
          in: communityIds,
        },
        user: {
          role: "LEADER",
        },
      },
    });

    return data.map(PrismaMembershipMapper.toDomain);
  }

  async findManyByCommunityId(communityId: string): Promise<Membership[]> {
    const data = await this.prisma.membership.findMany({
      where: {
        communityId,
      },
    });

    return data.map(PrismaMembershipMapper.toDomain);
  }

  async findCountByCommunityId(communityId: string): Promise<number> {
    return this.prisma.membership.count({
      where: {
        communityId,
      },
    });
  }

  async createMany(memberships: Membership[], tx?: Transaction): Promise<void> {
    if (memberships.length === 0) {
      return;
    }

    const client = (tx as TransactionClient) ?? this.prisma;
    const data = memberships.map(PrismaMembershipMapper.toPrismaMany);

    await client.membership.createMany({
      data,
    });
  }

  async removeMany(memberships: Membership[], tx?: Transaction): Promise<void> {
    if (memberships.length === 0) {
      return;
    }

    const client = (tx as TransactionClient) ?? this.prisma;

    const data = memberships.map(PrismaMembershipMapper.toPrismaMany);

    await client.membership.deleteMany({
      where: {
        OR: data.map((membership) => ({
          communityId: membership.communityId,
          userId: membership.userId,
        })),
      },
    });
  }

  async removeManyByUserId(userId: string): Promise<void> {
    await this.prisma.membership.deleteMany({
      where: {
        userId,
      },
    });
  }
}
