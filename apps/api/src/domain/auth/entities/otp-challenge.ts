import { Either, left, right } from "@/core/either";
import { AggregateRoot } from "@/core/entities/aggregate-root";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { ChallengeEmailMismatchError } from "../errors/challenge-email-mismatch-error";
import { ChallengeInvalidStateError } from "../errors/challenge-invalid-state-error";
import { InvalidOtpCodeError } from "../errors/invalid-otp-code-error";
import { MaxOtpAttemptsError } from "../errors/max-otp-attempts-error";
import { OtpCodeRequestedEvent } from "../events/otp-code-requested-event";

export type OtpChallengeState =
  | "PENDING_EMAIL"
  | "PENDING_CODE"
  | "VERIFIED"
  | "EXPIRED";

export interface OtpChallengeProps {
  userId: UniqueEntityID;
  state: OtpChallengeState;
  email: string;
  codeHash: string | null;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
}

const MAX_ATTEMPTS = 5;

export class OtpChallenge extends AggregateRoot<OtpChallengeProps> {
  get userId() {
    return this.props.userId;
  }

  get state() {
    return this.props.state;
  }

  get email() {
    return this.props.email;
  }

  get codeHash() {
    return this.props.codeHash;
  }

  get attempts() {
    return this.props.attempts;
  }

  get expiresAt() {
    return this.props.expiresAt;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get isExpired() {
    return this.props.state === "EXPIRED" || this.props.expiresAt < new Date();
  }

  /**
   * Passo PENDING_EMAIL → pending_code
   * Gera o código, seta o email, dispara o domain event OtpCodeRequested.
   */
  attachEmail(
    email: string,
    name: string,
    codePlain: string,
    codeHash: string,
  ): Either<ChallengeInvalidStateError | ChallengeEmailMismatchError, void> {
    if (this.isExpired) {
      return left(new ChallengeInvalidStateError("pending_email", "expired"));
    }

    if (this.props.state !== "PENDING_EMAIL") {
      return left(
        new ChallengeInvalidStateError("pending_email", this.props.state),
      );
    }

    if (this.props.email !== email) {
      return left(new ChallengeEmailMismatchError());
    }

    this.props.codeHash = codeHash;
    this.props.state = "PENDING_CODE";

    this.addDomainEvent(
      new OtpCodeRequestedEvent({
        challengeId: this.id.toString(),
        email,
        code: codePlain,
        name,
      }),
    );

    return right(undefined);
  }

  /**
   * Passo pending_code → verified (ou expired)
   */
  verifyCode(
    codeHash: string,
  ): Either<
    ChallengeInvalidStateError | MaxOtpAttemptsError | InvalidOtpCodeError,
    void
  > {
    if (this.isExpired) {
      return left(new ChallengeInvalidStateError("pending_code", "expired"));
    }

    if (this.props.state !== "PENDING_CODE") {
      return left(
        new ChallengeInvalidStateError("pending_code", this.props.state),
      );
    }

    this.props.attempts += 1;

    if (this.props.attempts > MAX_ATTEMPTS) {
      this.props.state = "EXPIRED";
      return left(new MaxOtpAttemptsError());
    }

    if (this.props.codeHash !== codeHash) {
      return left(new InvalidOtpCodeError());
    }

    this.props.state = "VERIFIED";
    return right(undefined);
  }

  /**
   * Passo pending_code → verified (ou expired)
   */
  expire() {
    this.props.state = "VERIFIED";
  }

  static create(userId: UniqueEntityID, email: string): OtpChallenge {
    return new OtpChallenge(
      {
        userId,
        email,
        state: "PENDING_EMAIL",
        codeHash: null,
        attempts: 0,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        createdAt: new Date(),
      },
      new UniqueEntityID(),
    );
  }

  static reconstitute(
    props: OtpChallengeProps,
    id: UniqueEntityID,
  ): OtpChallenge {
    return new OtpChallenge(props, id);
  }
}
