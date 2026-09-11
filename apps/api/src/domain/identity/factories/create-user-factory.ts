import { Coordinate } from "@/core/value-objects/coordinate";
import { User, UserStatusEnum } from "../entities/user";
import { BirthDate } from "../value-objects/birth-date";
import { Cpf } from "../value-objects/cpf";
import { Email } from "../value-objects/email";
import { FullName } from "../value-objects/full-name";
import { Phone } from "../value-objects/phone";

type CreateUserData = {
  name: FullName;
  coordinate: Coordinate;
  cpf: Cpf;
  email: Email;
  phone: Phone;
  birthDate: BirthDate;
};

export class CreateUserFactory {
  static create(data: CreateUserData): User {
    const user = User.create({
      ...data,
      status: UserStatusEnum.ACTIVED,
      avatarUrl: null,
      emailRecovery: null,
      lastSignInAt: null,
      mapTutorialCompletedAt: null,
      createdAt: new Date(),
      updatedAt: null,
    });

    return user;
  }
}
