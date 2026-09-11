import { Either, left, right } from "@/core/either";
import { AggregateRoot } from "@/core/entities/aggregate-root";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { ResetTokenInvalidError } from "../errors/reset-token-invalid-error";
import { PasswordResetRequestedEvent } from "../events/password-reset-requested-event";

export interface PasswordResetProps {
  userId: UniqueEntityID;
  email: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export class PasswordReset extends AggregateRoot<PasswordResetProps> {
  get userId() {
    return this.props.userId;
  }

  get email() {
    return this.props.email;
  }

  get expiresAt() {
    return this.props.expiresAt;
  }

  get usedAt() {
    return this.props.usedAt;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get isValid() {
    return !this.props.usedAt && this.props.expiresAt > new Date();
  }

  consume(): Either<ResetTokenInvalidError, void> {
    if (this.props.usedAt) return left(new ResetTokenInvalidError());

    if (this.props.expiresAt < new Date())
      return left(new ResetTokenInvalidError());

    this.props.usedAt = new Date();
    return right(undefined);
  }

  static create(
    userId: UniqueEntityID,
    email: string,
    emailMasked: string,
    name: string,
    tokenHash: string,
    tokenPlain: string,
  ): PasswordReset {
    const reset = new PasswordReset(
      {
        userId,
        email,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        usedAt: null,
        createdAt: new Date(),
      },
      new UniqueEntityID(tokenHash),
    );

    reset.addDomainEvent(
      new PasswordResetRequestedEvent({
        resetId: reset.id.toString(),
        email,
        token: tokenPlain,
        name,
        emailMasked,
      }),
    );

    return reset;
  }

  static reconstitute(
    props: PasswordResetProps,
    id: UniqueEntityID,
  ): PasswordReset {
    return new PasswordReset(props, id);
  }
}
