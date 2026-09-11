import { Either, left, right } from "@/core/either";
import { Validate } from "@/core/validations/validate";
import { EmailBadFormattedError } from "../errors/email-bad-formatted-error";

export class Email {
  private readonly value: string;

  protected constructor(value: string) {
    this.value = value;
  }

  toValue(): string {
    return this.value;
  }

  equals(value: Email): boolean {
    return this.value === value.toValue();
  }

  static validate(value: string): boolean {
    return Validate.isValidEmail(value);
  }

  static create(value: string): Either<EmailBadFormattedError, Email> {
    const normalized = Email.normalize(value);

    if (!Email.validate(normalized)) {
      return left(new EmailBadFormattedError());
    }

    return right(new Email(normalized));
  }

  static fromString(value: string): Email {
    return new Email(Email.normalize(value));
  }

  private static normalize(value: string): string {
    return value.trim().toLowerCase();
  }
}
