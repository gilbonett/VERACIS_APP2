import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Coordinate } from "@/core/value-objects/coordinate";
import {
  User,
  UserProps,
  UserStatusEnum,
} from "@/domain/identity/entities/user";
import { BirthDate } from "@/domain/identity/value-objects/birth-date";
import { Cpf } from "@/domain/identity/value-objects/cpf";
import { Email } from "@/domain/identity/value-objects/email";
import { FullName } from "@/domain/identity/value-objects/full-name";
import { Phone } from "@/domain/identity/value-objects/phone";
import { PrismaService } from "@/infra/database/prisma/prisma.service";
import { Injectable } from "@nestjs/common";

export function makeUser(
  override: Partial<UserProps> = {},
  id?: UniqueEntityID,
): User {
  return User.create(
    {
      name: override.name ?? FullName.fromString("Jhon Joe"),
      email: override.email ?? Email.fromString("jhon.joe@example.com"),
      cpf: override.cpf ?? Cpf.fromString("24097196006"),
      birthDate: override.birthDate ?? BirthDate.fromString("1990-01-01"),
      status: override.status ?? UserStatusEnum.ACTIVED,
      phone: override.phone ?? Phone.fromString("93 99184-8032"),
      avatarUrl: override.avatarUrl ?? null,
      coordinate:
        override.coordinate ?? Coordinate.reconstitute(-50.191445, 2.944032),
      createdAt: override.createdAt ?? new Date(),
      updatedAt: override.updatedAt ?? null,
      emailRecovery: override.emailRecovery ?? null,
      lastSignInAt: override.lastSignInAt ?? null,
      mapTutorialCompletedAt: override.mapTutorialCompletedAt ?? null,
      ...override,
    },
    id,
  );
}

@Injectable()
export class UserFactory {
  constructor(private prisma: PrismaService) {}

  async makePrismaUser(data: Partial<UserProps> = {}) {
    // const user = makeUser(data);
    // await this.prisma.user.create({
    //   data: PrismaUserMapper.toPrisma(user),
    // });
    // return user;
  }
}
