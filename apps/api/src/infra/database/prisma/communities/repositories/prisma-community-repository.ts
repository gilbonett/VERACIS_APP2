import { Community } from "@/domain/communities/entities/community";
import {
  CommunityRepository,
  IQueriesCommunityRepository,
} from "@/domain/communities/repositories/community-repository";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { PrismaCommunityMapper } from "../mappers/prisma-community-mapper";

@Injectable()
export class PrismaCommunityRepository implements CommunityRepository {
  constructor(private prisma: PrismaService) {}

  async findManyWithQueries(
    query: IQueriesCommunityRepository,
  ): Promise<Community[]> {
    const { biomeId } = query;
    const communities = await this.prisma.community.findMany({
      where: {
        ...(biomeId && { biomeId: { equals: biomeId } }),
      },
      orderBy: {
        name: "asc",
      },
    });

    return communities.map(PrismaCommunityMapper.toDomain);
  }

  async create(community: Community): Promise<void> {
    const data = PrismaCommunityMapper.toPrisma(community);

    await this.prisma.community.create({
      data,
    });
  }

  async findById(id: string): Promise<Community | null> {
    const community = await this.prisma.community.findUnique({
      where: {
        id,
      },
    });

    if (!community) {
      return null;
    }

    return PrismaCommunityMapper.toDomain(community);
  }

  async findAll(): Promise<Community[]> {
    const communities = await this.prisma.community.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return communities.map(PrismaCommunityMapper.toDomain);
  }

  async save(community: Community): Promise<void> {
    const data = PrismaCommunityMapper.toPrisma(community);

    await this.prisma.community.update({
      where: {
        id: data.id,
      },
      data,
    });
  }

  async delete(community: Community): Promise<void> {
    await this.prisma.community.delete({
      where: {
        id: community.id.toString(),
      },
    });
  }
}
