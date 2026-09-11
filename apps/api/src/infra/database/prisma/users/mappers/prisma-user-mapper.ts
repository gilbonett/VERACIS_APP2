import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Membership } from "@/domain/users/entities/membership";
import { User } from "@/domain/users/entities/user";
import { UserMembershipList } from "@/domain/users/entities/user-membership-list";
import {
  Prisma,
  Community as PrismaCommunity,
  Membership as PrismaMembership,
  User as PrismaUser,
} from "@generated/client";

interface PrismaMembershipWithCommunity extends PrismaMembership {
  community: PrismaCommunity & {
    biome: {
      name: string;
    };
  };
}

interface PrismaUserWithMemberships extends PrismaUser {
  memberships: PrismaMembershipWithCommunity[];
}

export class PrismaUserMapper {
  private static toDate(value: unknown): Date {
    if (value instanceof Date) {
      return value;
    }
    return new Date(value as string);
  }

  private static toDateOrNull(value: unknown): Date | null {
    if (value == null) {
      return null;
    }
    return PrismaUserMapper.toDate(value);
  }

  static toDomainFromCache(raw: PrismaUserWithMemberships): User {
    return PrismaUserMapper.toDomain({
      ...raw,
      birthDate: PrismaUserMapper.toDate(raw.birthDate),
      lastSignInAt: PrismaUserMapper.toDateOrNull(raw.lastSignInAt),
      mapTutorialCompletedAt: PrismaUserMapper.toDateOrNull(
        raw.mapTutorialCompletedAt,
      ),
      createdAt: PrismaUserMapper.toDate(raw.createdAt),
      updatedAt: PrismaUserMapper.toDate(raw.updatedAt),
    });
  }

  static toDomain({ memberships, ...raw }: PrismaUserWithMemberships): User {
    const membershipList = memberships.map((membership) =>
      Membership.reconstitute({
        communityId: new UniqueEntityID(membership.communityId),
        communityName: membership.community.name,
        biomeName: membership.community.biome.name,
        userId: new UniqueEntityID(membership.userId),
      }),
    );

    return User.reconstitute(
      {
        status: raw.status,
        role: raw.role,
        name: raw.name,
        cpf: raw.cpf,
        email: raw.email,
        emailRecovery: raw.emailRecovery,
        phone: raw.phone,
        lastedLat: raw.lastedLat,
        lastedLng: raw.lastedLng,
        password: raw.password,
        avatarUrl: raw.avatarUrl,
        birthDate: raw.birthDate,
        lastSignInAt: raw.lastSignInAt,
        mapTutorialCompletedAt: raw.mapTutorialCompletedAt,
        isVerified: raw.isVerified,
        communities: new UserMembershipList(membershipList),
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        otpEnabled: raw.otpEnabled,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPrisma(data: User): Prisma.UserUncheckedCreateInput {
    return {
      id: data.id.toValue(),
      status: data.status,
      role: data.role,
      name: data.name,
      cpf: data.cpf,
      email: data.email,
      emailRecovery: data.emailRecovery,
      phone: data.phone,
      lastedLat: data.lastedLat,
      lastedLng: data.lastedLng,
      password: data.password,
      birthDate: data.birthDate,
      avatarUrl: data.avatarUrl,
      lastSignInAt: data.lastSignInAt,
      mapTutorialCompletedAt: data.mapTutorialCompletedAt,
      isVerified: data.isVerified,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      otpEnabled: data.otpEnabled,
    };
  }
}
