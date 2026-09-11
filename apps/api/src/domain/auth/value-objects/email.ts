import { Either, left, right } from "@/core/either";

export type EmailError = "INVALID_EMAIL";

export class Email {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  get value() {
    return this._value;
  }

  static create(raw: string): Either<EmailError, Email> {
    const normalized = raw.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized))
      return left("INVALID_EMAIL");

    return right(new Email(normalized));
  }
}
