import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";

type SigningAlgorithm = "RS256" | "ES256" | "HS256";

type SigningKeyStatus = "ACTIVE" | "RETIRING" | "RETIRED";

type SigninKeyProps = {
  algorithm: SigningAlgorithm;
  status: SigningKeyStatus;
  publicKey: string;
  privateKeyEncrypted: string;

  createdAt: Date;
  activatedAt: Date | null;
  retiredAt: Date | null;
};

export class SigninKey extends Entity<SigninKeyProps> {
  get algorithm() {
    return this.props.algorithm;
  }

  get status() {
    return this.props.status;
  }

  get publicKey() {
    return this.props.publicKey;
  }

  get privateKeyEncrypted() {
    return this.props.privateKeyEncrypted;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get activatedAt() {
    return this.props.activatedAt;
  }

  get retiredAt() {
    return this.props.retiredAt;
  }

  static create(props: SigninKeyProps, kid?: UniqueEntityID) {
    return new SigninKey(props, kid);
  }
}
