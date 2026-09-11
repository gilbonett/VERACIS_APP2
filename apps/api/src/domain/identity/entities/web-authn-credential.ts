import { Either, left, right } from "@/core/either";
import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { CredentialCloneSuspectedError } from "../errors/credential-clone-suspected-error";

export type WebAuthnCredentialProps = {
  credentialId: string;
  publicKey: string;
  signCount: number;
  transports: string[];

  isDefault: boolean;
  deviceName: string | null;
  aaguid: string | null;
  backupEligible: boolean | null;
  backupState: boolean | null;

  userId: UniqueEntityID;

  createdAt: Date;
  updatedAt: Date | null;
  lastUsedAt: Date | null;
};

export class WebAuthnCredential extends Entity<WebAuthnCredentialProps> {
  get credentialId() {
    return this.props.credentialId;
  }

  get publicKey() {
    return this.props.publicKey;
  }

  get signCount() {
    return this.props.signCount;
  }

  get transports() {
    return this.props.transports;
  }

  get isDefault() {
    return this.props.isDefault;
  }

  get deviceName() {
    return this.props.deviceName;
  }

  get aaguid() {
    return this.props.aaguid;
  }

  get backupEligible() {
    return this.props.backupEligible;
  }

  get backupState() {
    return this.props.backupState;
  }

  get lastUsedAt() {
    return this.props.lastUsedAt;
  }

  get userId() {
    return this.props.userId;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  public verifyAndUpdateSignCount(
    newSignCount: number,
  ): Either<CredentialCloneSuspectedError, void> {
    if (newSignCount <= this.props.signCount) {
      return left(new CredentialCloneSuspectedError());
    }

    this.props.signCount = newSignCount;
    this.props.lastUsedAt = new Date();
    this.touch();

    return right(undefined);
  }

  public markAsDefault() {
    this.props.isDefault = true;
    this.touch();
  }

  public unmarkAsDefault() {
    this.props.isDefault = false;
    this.touch();
  }

  public rename(deviceName: string | null) {
    this.props.deviceName = deviceName;
    this.touch();
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  static build(props: WebAuthnCredentialProps, id?: UniqueEntityID) {
    return new WebAuthnCredential(props, id);
  }
}
