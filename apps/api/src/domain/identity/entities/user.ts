import { AggregateRoot } from "@/core/entities/aggregate-root";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Coordinate } from "@/core/value-objects/coordinate";
import { BirthDate } from "../value-objects/birth-date";
import { Cpf } from "../value-objects/cpf";
import { Email } from "../value-objects/email";
import { FullName } from "../value-objects/full-name";
import { Phone } from "../value-objects/phone";

export enum UserStatusEnum {
  ACTIVED = "ACTIVED",
  DISABLED = "DISABLED",
  BLOCKED = "BLOCKED",
}

export type UserProps = {
  status: UserStatusEnum;
  name: FullName;
  coordinate: Coordinate;
  cpf: Cpf;
  email: Email;
  birthDate: BirthDate;
  emailVerified: boolean;
  phone: Phone | null;
  avatarUrl: string | null;
  mapTutorialCompletedAt: Date | null;
  lastSignInAt: Date | null;

  createdAt: Date;
  updatedAt: Date | null;
};

export class User extends AggregateRoot<UserProps> {
  get status(): UserStatusEnum {
    return this.props.status;
  }

  get name(): FullName {
    return this.props.name;
  }

  get coordinate(): Coordinate {
    return this.props.coordinate;
  }

  get cpf(): Cpf {
    return this.props.cpf;
  }

  get email(): Email {
    return this.props.email;
  }

  get emailVerified(): boolean {
    return this.props.emailVerified;
  }

  get phone(): Phone | null {
    return this.props.phone;
  }

  get birthDate(): BirthDate {
    return this.props.birthDate;
  }

  get avatarUrl(): string | null {
    return this.props.avatarUrl;
  }

  get mapTutorialCompletedAt(): Date | null {
    return this.props.mapTutorialCompletedAt;
  }

  get lastSignInAt(): Date | null {
    return this.props.lastSignInAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | null {
    return this.props.updatedAt;
  }

  get isActive(): boolean {
    return this.props.status === "ACTIVED";
  }

  get isDisabled(): boolean {
    return this.props.status === "DISABLED";
  }

  get isBlocked(): boolean {
    return this.props.status === "BLOCKED";
  }

  public completeMapTutorial() {
    this.props.mapTutorialCompletedAt = new Date();
    this.touch();
  }

  public recordSignIn() {
    this.props.lastSignInAt = new Date();
    this.touch();
  }

  public updateAvatarUrl(avatarUrl: string) {
    this.props.avatarUrl = avatarUrl;
    this.touch();
  }

  public updateStatus(status: UserStatusEnum) {
    if (this.props.status === status) return;

    this.props.status = status;
    this.touch();
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  static create(props: UserProps, id?: UniqueEntityID): User {
    return new User(props, id);
  }
}
