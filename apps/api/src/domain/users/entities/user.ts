import { AggregateRoot } from "@/core/entities/aggregate-root";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { UserCreatedEvent } from "../events/user-created-event";
import { UserRegistered } from "../events/user-registered-event";
import { UserTermsAcceptedEvent } from "../events/user-terms-accepted-event";
import { Membership } from "./membership";
import { UserMembershipList } from "./user-membership-list";

export type UserStatus = "ACTIVED" | "DISABLED" | "BLOCKED";
export type UserRole = "MEMBER" | "LEADER" | "MANAGER" | "ROOT";

export interface UserProps {
  cpf: string;
  email: string;
  name: string;
  password?: string | null;
  role: UserRole;
  status: UserStatus;
  lastedLat: number;
  lastedLng: number;
  otpEnabled: boolean;
  emailRecovery?: string | null;
  phone?: string | null;
  birthDate: Date;
  avatarUrl?: string | null;
  isVerified: boolean;
  lastSignInAt?: Date | null;
  mapTutorialCompletedAt?: Date | null;
  createdAt: Date;
  updatedAt?: Date;

  communities: UserMembershipList;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  phone?: string | null;
  emailRecovery?: string | null;
  avatarUrl?: string | null;
}

export interface CreateProfileData {
  name: string;
  cpf: string;
  birthDate: Date;
  role: UserRole;
  lastedLat: number;
  lastedLng: number;
  phone: string;
  email: string;
  password: string;
  termsId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  communityIds: string[];
}

export class User extends AggregateRoot<UserProps> {
  get cpf() {
    return this.props.cpf;
  }

  get email() {
    return this.props.email;
  }

  get name() {
    return this.props.name;
  }

  get passwordHash() {
    return this.props.password;
  }

  get role() {
    return this.props.role;
  }

  get status() {
    return this.props.status;
  }

  get lastedLat() {
    return this.props.lastedLat;
  }

  get lastedLng() {
    return this.props.lastedLng;
  }

  get otpEnabled() {
    return this.props.otpEnabled;
  }

  get emailRecovery() {
    return this.props.emailRecovery;
  }

  get phone() {
    return this.props.phone;
  }

  get birthDate() {
    return this.props.birthDate;
  }

  get password() {
    return this.props.password;
  }

  get avatarUrl() {
    return this.props.avatarUrl;
  }

  get isVerified() {
    return this.props.isVerified;
  }

  get lastSignInAt() {
    return this.props.lastSignInAt;
  }

  get mapTutorialCompletedAt() {
    return this.props.mapTutorialCompletedAt ?? null;
  }

  get hasCompletedMapTutorial() {
    return this.mapTutorialCompletedAt !== null;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  get communities() {
    return this.props.communities;
  }

  get emailMasked() {
    const [local, domain] = this.props.email.split("@");
    if (!domain) return "***";
    const visible = local.slice(0, 2);
    return `${visible}***@${domain}`;
  }

  updateProfile(data: UpdateProfileData): void {
    if (data.name !== undefined) this.props.name = data.name;
    if (data.email !== undefined) this.props.email = data.email;
    if (data.phone !== undefined) this.props.phone = data.phone;
    if (data.emailRecovery !== undefined)
      this.props.emailRecovery = data.emailRecovery;
    if (data.avatarUrl !== undefined) this.props.avatarUrl = data.avatarUrl;
    this.props.updatedAt = new Date();
  }

  updatePassword(password: string): void {
    this.props.password = password;
    this.props.updatedAt = new Date();
  }

  enableOtp(): void {
    this.props.otpEnabled = true;
    this.props.updatedAt = new Date();
  }

  disableOtp(): void {
    this.props.otpEnabled = false;
    this.props.updatedAt = new Date();
  }

  disable(): void {
    this.props.status = "DISABLED";
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.status = "ACTIVED";
    this.props.updatedAt = new Date();
  }

  recordSignIn(): void {
    this.props.lastSignInAt = new Date();
    this.props.updatedAt = new Date();
  }

  completeMapTutorial(): void {
    if (this.hasCompletedMapTutorial) {
      return;
    }
    this.props.mapTutorialCompletedAt = new Date();
    this.props.updatedAt = new Date();
  }

  markEmailVerified(): void {
    this.props.isVerified = true;
    this.props.updatedAt = new Date();
  }

  aggreateCommunities(communityIds: string[]) {
    const aggregates = communityIds.map((communityId) =>
      Membership.create({
        userId: this.id,
        communityId: new UniqueEntityID(communityId),
      }),
    );

    this.props.communities = new UserMembershipList(aggregates);
  }

  static create(data: CreateProfileData): User {
    const now = new Date();

    const user = new User({
      ...data,
      status: "ACTIVED",
      communities: new UserMembershipList(),
      createdAt: now,
      updatedAt: now,
      otpEnabled: true,
      isVerified: true,
    });

    user.aggreateCommunities(data.communityIds);

    user.addDomainEvent(
      new UserRegistered({
        userId: user.id.toString(),
        name: user.name,
        email: user.email,
      }),
    );
    user.addDomainEvent(
      new UserTermsAcceptedEvent({
        userId: user.id.toString(),
        termsId: data.termsId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      }),
    );

    if (user.role === "MEMBER") {
      user.addDomainEvent(
        new UserCreatedEvent({
          userId: user.id.toString(),
          name: user.name,
          communityIds: data.communityIds,
        }),
      );
    }

    return user;
  }

  static reconstitute(props: UserProps, id: UniqueEntityID): User {
    return new User(props, id);
  }
}
