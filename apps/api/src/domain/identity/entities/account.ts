import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";

export const CREDENTIAL_PROVIDER_ID = "credential";

export type AccountProps = {
  accountId: string;
  providerId: string;
  accessToken: string | null;
  refreshToken: string | null;
  idToken: string | null;
  accessTokenExpiresAt: Date | null;
  refreshTokenExpiresAt: Date | null;
  scope: string | null;
  passwordHash: string | null;
  failedAttempts: number | null;
  lockedUntil: Date | null;
  lastPasswordChangeAt: Date | null;

  rawAssuranceClaim: string | null;
  linkedAt: Date | null;

  userId: UniqueEntityID;

  createdAt: Date;
  updatedAt: Date | null;
};

export class Account extends Entity<AccountProps> {
  get accountId() {
    return this.props.accountId;
  }

  get providerId() {
    return this.props.providerId;
  }

  get userId() {
    return this.props.userId;
  }

  get accessToken() {
    return this.props.accessToken;
  }

  get refreshToken() {
    return this.props.refreshToken;
  }

  get idToken() {
    return this.props.idToken;
  }

  get accessTokenExpiresAt() {
    return this.props.accessTokenExpiresAt;
  }

  get refreshTokenExpiresAt() {
    return this.props.refreshTokenExpiresAt;
  }

  get scope() {
    return this.props.scope;
  }

  get passwordHash() {
    return this.props.passwordHash;
  }

  get failedAttempts() {
    return this.props.failedAttempts;
  }

  get lockedUntil() {
    return this.props.lockedUntil;
  }

  get lastPasswordChangeAt() {
    return this.props.lastPasswordChangeAt;
  }

  get rawAssuranceClaim() {
    return this.props.rawAssuranceClaim;
  }

  get linkedAt() {
    return this.props.linkedAt;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  get isLocked() {
    return (
      this.props.lockedUntil !== null && this.props.lockedUntil > new Date()
    );
  }

  public unlock() {
    this.props.lockedUntil = null;
    this.touch();
  }

  private lockUntil(minutes = 15) {
    this.props.lockedUntil = new Date(Date.now() + minutes * 60_000);
  }

  public incrementFailedAttempts() {
    const maxFailedAttempts = 5;

    this.props.failedAttempts = (this.props.failedAttempts ?? 0) + 1;

    if (this.props.failedAttempts >= maxFailedAttempts) {
      this.lockUntil();
    }

    this.touch();
  }

  public resetFailedAttempts() {
    this.props.failedAttempts = 0;
    this.touch();
  }

  public updatePassword(passwordHash: string) {
    this.props.passwordHash = passwordHash;
    this.props.lastPasswordChangeAt = new Date();
    this.touch();
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  static createCredential(props: {
    userId: UniqueEntityID;
    passwordHash: string;
    createdAt?: Date;
  }): Account {
    const now = new Date();

    return new Account({
      accountId: props.userId.toString(),
      providerId: CREDENTIAL_PROVIDER_ID,
      userId: props.userId,
      accessToken: null,
      refreshToken: null,
      idToken: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
      scope: null,
      passwordHash: props.passwordHash,
      failedAttempts: 0,
      lockedUntil: null,
      lastPasswordChangeAt: props.createdAt ?? now,
      rawAssuranceClaim: null,
      linkedAt: null,
      createdAt: props.createdAt ?? now,
      updatedAt: null,
    });
  }

  static createFederated(props: {
    userId: UniqueEntityID;
    providerId: string;
    accountId: string;
    accessToken: string | null;
    refreshToken: string | null;
    idToken: string | null;
    accessTokenExpiresAt: Date | null;
    scope: string | null;
    rawAssuranceClaim: string | null;
    createdAt?: Date;
    linkedAt?: Date;
  }): Account {
    const now = new Date();

    return new Account({
      accountId: props.accountId,
      providerId: props.providerId,
      userId: props.userId,
      accessToken: props.accessToken,
      refreshToken: props.refreshToken,
      idToken: props.idToken,
      accessTokenExpiresAt: props.accessTokenExpiresAt,
      refreshTokenExpiresAt: null,
      scope: props.scope,
      passwordHash: null,
      failedAttempts: null,
      lockedUntil: null,
      lastPasswordChangeAt: null,
      rawAssuranceClaim: props.rawAssuranceClaim,
      linkedAt: props.linkedAt ?? now,
      createdAt: props.createdAt ?? now,
      updatedAt: null,
    });
  }

  static reconstitute(props: AccountProps, id: UniqueEntityID): Account {
    return new Account(props, id);
  }
}
