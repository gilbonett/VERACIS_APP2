import { User } from "@/domain/users/entities/user";
import { MembershipRepository } from "@/domain/users/repositories/membership-repository";
import { UserRepository } from "@/domain/users/repositories/user-repository";
import { CacheRepository } from "@/infra/cache/cache-repository";
import { Injectable } from "@nestjs/common";
import { OutboxRepository } from "../../outbox/outbox-repository";
import { PrismaService } from "../../prisma.service";
import { PrismaUserMapper } from "../mappers/prisma-user-mapper";

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(
    private prisma: PrismaService,
    private membershipRepository: MembershipRepository,
    private cache: CacheRepository,
    private outboxRepository: OutboxRepository,
  ) {}

  private cacheKey(userId: string) {
    return `users:${userId}`;
  }

  async invalidateProfileCache(userId: string): Promise<void> {
    await this.cache.delete(this.cacheKey(userId));
  }

  async updatePassword(userId: string, password: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { password },
    });
  }

  async delete(user: User): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.user.delete({
        where: { id: user.id.toString() },
      });
      await this.outboxRepository.create(user, tx);
    });

    await this.cache.delete(this.cacheKey(user.id.toString()));
    user.clearEvents();
  }

  async findByPhone(phone: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: { phone },
      include: {
        memberships: {
          include: {
            community: {
              include: {
                biome: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    return PrismaUserMapper.toDomain(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: {
            community: {
              include: {
                biome: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    return PrismaUserMapper.toDomain(user);
  }

  async findByCpf(cpf: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { cpf },
      include: {
        memberships: {
          include: {
            community: {
              include: {
                biome: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    return PrismaUserMapper.toDomain(user);
  }

  async create(user: User): Promise<void> {
    const data = PrismaUserMapper.toPrisma(user);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.create({
        data,
      });

      await this.membershipRepository.createMany(
        user.communities.getItems(),
        tx,
      );
      await this.outboxRepository.create(user, tx);
    });

    user.clearEvents();
  }

  async findById(id: string): Promise<User | null> {
    const cacheHit = await this.cache.get(this.cacheKey(id));

    if (cacheHit) {
      return PrismaUserMapper.toDomainFromCache(JSON.parse(cacheHit));
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        memberships: {
          include: {
            community: {
              include: {
                biome: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    await this.cache.set(this.cacheKey(id), JSON.stringify(user));

    return PrismaUserMapper.toDomain(user);
  }

  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      include: {
        memberships: {
          include: {
            community: {
              include: {
                biome: true,
              },
            },
          },
        },
      },
    });

    return users.map(PrismaUserMapper.toDomain);
  }

  async save(user: User): Promise<void> {
    const data = PrismaUserMapper.toPrisma(user);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id.toValue() },
        data,
      });

      await this.membershipRepository.createMany(
        user.communities.getNewItems(),
        tx,
      );
      await this.membershipRepository.removeMany(
        user.communities.getRemovedItems(),
        tx,
      );
      await this.outboxRepository.create(user, tx);
    });

    await this.cache.delete(this.cacheKey(user.id.toValue()));
    user.clearEvents();
  }
}
